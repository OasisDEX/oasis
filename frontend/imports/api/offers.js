import { Mongo } from 'meteor/mongo';
import { Session } from 'meteor/session';
import { BigNumber } from 'meteor/ethereum:web3';
import { dapp, web3 } from 'meteor/makerotc:dapp';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

import Transactions from '/imports/api/transactions';
import { formatError } from '/imports/utils/functions';

import { convertToTokenPrecision, convertTo18Precision } from '/imports/utils/conversion';

const Offers = new Mongo.Collection(null);
const Trades = new Mongo.Collection(null);

const Status = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

const CANCEL_GAS = 1000000;

const TRADES_LIMIT = 0;
Session.set('lastTradesLimit', TRADES_LIMIT);

const OFFER_LIMIT = 0;
Session.set('orderBookLimit', OFFER_LIMIT);

const helpers = {
  volume(currency) {
    let volume = '0';
    if (this.buyWhichToken === currency) {
      volume = this.buyHowMuch;
    } else if (this.sellWhichToken === currency) {
      volume = this.sellHowMuch;
    }
    return volume;
  },
  type() {
    const baseCurrency = Session.get('baseCurrency');
    let type = '';
    if (this.buyWhichToken === baseCurrency) {
      type = 'bid';
    } else if (this.sellWhichToken === baseCurrency) {
      type = 'ask';
    }
    return type;
  },
  price() {
    const quoteCurrency = Session.get('quoteCurrency');
    const baseCurrency = Session.get('baseCurrency');
    let price = '0';
    if (this.buyWhichToken === quoteCurrency && this.sellWhichToken === baseCurrency) {
      price = new BigNumber(this.buyHowMuch).div(new BigNumber(this.sellHowMuch));
    } else if (this.buyWhichToken === baseCurrency && this.sellWhichToken === quoteCurrency) {
      price = new BigNumber(this.sellHowMuch).div(new BigNumber(this.buyHowMuch));
    }
    return price;
  },
};

Offers.helpers(_.extend(helpers, {
  canCancel() {
    const marketOpen = Session.get('market_open');
    const address = Session.get('address');
    return this.status === Status.CONFIRMED && (!marketOpen || address === this.owner);
  },
  isOurs() {
    const address = Session.get('address');
    return (address === this.owner);
  },
}));

Trades.helpers(helpers);

/**
 * Get if market is open
 */
Offers.checkMarketOpen = () => {
   // Fetch the market close time
  dapp['maker-otc'].objects.otc.close_time((error, t) => {
    if (!error) {
      const closeTime = t.toNumber();
      Session.set('close_time', closeTime);
      Session.set('market_open', closeTime > (new Date() / 1000));
    }
  });
};

// As it is expensive to load historical Trades, we load them only for the last week
// Enough for the Volume chart and the Market History section
Offers.getHistoricalTradesRange = (numberOfPreviousDays) => {
  // 5760 is an average number of blocks per day. in case we didn't get far enough
  // after the initial jump we step back 1000 blocks at a time
  const INITIAL_NUMBER_OF_BLOCKS_BACKWARDS = 5760*(numberOfPreviousDays+1)+3000;
  const STEP_NUMBER_OF_BLOCKS_BACKWARDS = 1000;

  function getBlockNumberOfTheMostRecentBlock() {
    return Offers.getBlock('latest').then((block) => block.number);
  }
  function getBlockNumberOfSomeBlockEarlierThan(timestamp, startingFrom) {
    if (startingFrom < 0) return Promise.resolve(0);
    return Offers.getBlock(startingFrom).then((block) => {
      if (block.timestamp*1000 <= timestamp) {
        return block.number;
      }
      else {
        return getBlockNumberOfSomeBlockEarlierThan(timestamp, startingFrom-STEP_NUMBER_OF_BLOCKS_BACKWARDS);
      }
    });
  }

  return getBlockNumberOfTheMostRecentBlock().then((blockNumberOfTheMostRecentBlock) => {
    const startTimestamp = moment(Date.now()).startOf('day').subtract(numberOfPreviousDays, 'days');
    const initialGuess = blockNumberOfTheMostRecentBlock-INITIAL_NUMBER_OF_BLOCKS_BACKWARDS;
    return getBlockNumberOfSomeBlockEarlierThan(startTimestamp, initialGuess).then((foundBlockNumber) => {
      return {
        startBlockNumber: foundBlockNumber,
        startTimestamp: startTimestamp,
        endBlockNumber: blockNumberOfTheMostRecentBlock
      };
    });
  });
};

/**
 * Syncs up all offers and trades
 */
Offers.sync = () => {
  Offers.checkMarketOpen();
  Offers.syncOffers();
  Offers.getHistoricalTradesRange(6).then(Offers.syncTrades);
};

Offers.syncOffers = () => {
  Offers.remove({});

  // Watch ItemUpdate Event
  /* eslint new-cap: ["error", { "capIsNewExceptions": ["ItemUpdate", "Trade"] }] */
  dapp['maker-otc'].objects.otc.ItemUpdate((error, result) => {
    if (!error) {
      const id = result.args.id.toNumber();
      Offers.syncOffer(id);
      Offers.remove(result.transactionHash);
    }
  });

  function cartesianProduct(arr)
  {
    return arr.reduce(function(a,b){
      return a.map(function(x){
        return b.map(function(y){
          return x.concat(y);
        })
      }).reduce(function(a,b){ return a.concat(b) }, [])
    }, [[]]);
  }

  function flatten(ary) {
    return ary.reduce(function(a, b) {
      if (Array.isArray(b)) {
        return a.concat(flatten(b))
      }
      return a.concat(b)
    }, [])
  }

  function syncOfferAndAllHigherOnes(id) {
    if (id != 0) {
      Session.set('loadingCounter', Session.get('loadingCounter')+1);
      Offers.syncOffer(id);
      return Offers.getHigherOfferId(id).then(syncOfferAndAllHigherOnes);
    }
    else return Promise.resolve(0);
  }

  Session.set('loading', true);
  Session.set('loadingCounter', 0);

  const currencyPairs = cartesianProduct([dapp.getQuoteTokens(), dapp.getBaseTokens()]);
  const promisesLowestOfferId = flatten(currencyPairs.map((pair) => [Offers.getLowestOfferId(pair[0], pair[1]),
                                                                     Offers.getLowestOfferId(pair[1], pair[0])]));
  const promisesSync = promisesLowestOfferId.map((promise) => promise.then(syncOfferAndAllHigherOnes));
  Promise.all(promisesSync).then(() => {
    Session.set('loading', false);
  });
};

Offers.syncTrades = (historicalTradesRange) => {
  function transformArgs(trade) {
    const buyWhichToken = dapp.getTokenByAddress(trade.args.buy_which_token);
    const sellWhichToken = dapp.getTokenByAddress(trade.args.sell_which_token);

    if (buyWhichToken && sellWhichToken) {
      // Transform arguments
      const args = {
        buyWhichToken_address: trade.args.buy_which_token,
        buyWhichToken,
        sellWhichToken_address: trade.args.sell_which_token,
        sellWhichToken,
        buyHowMuch: convertTo18Precision(trade.args.buy_how_much.toString(10), buyWhichToken),
        sellHowMuch: convertTo18Precision(trade.args.sell_how_much.toString(10), sellWhichToken),
      };
      return args;
    }
    return false;
  }


  // Get all Trade events in one go so we can fill up prices, volume and history
  dapp['maker-otc'].objects.otc.Trade({}, { fromBlock: historicalTradesRange.startBlockNumber,
    toBlock: historicalTradesRange.endBlockNumber }).get((error, trades) => {
    if (!error) {
      let trade = null;
      const promises = [];

      if (trades.length > 0) {
        for (let i = 0; i < trades.length; i++) {
          promises.push(Offers.getBlock(trades[i].blockNumber));
        }

        Promise.all(promises).then((resultProm) => {
          for (let i = 0; i < trades.length; i++) {
            trade = trades[i];
            const args = transformArgs(trade);

            if (args && (resultProm[i].timestamp*1000 >= historicalTradesRange.startTimestamp)) {
              Trades.upsert(trade.transactionHash, _.extend(resultProm[i], trade, args));
            }
          }
          Session.set('loadingTradeHistory', false);
        });
      } else {
        Session.set('loadingTradeHistory', false);
      }
    }
  });

  // Watch Trade events in realtime
  dapp['maker-otc'].objects.otc.Trade({}, { fromBlock: historicalTradesRange.endBlockNumber+1 }, (error, trade) => {
    if (!error) {
      const args = transformArgs(trade);
      if (args) {
        // Get block for timestamp
        web3.eth.getBlock(trade.blockNumber, (blockError, block) => {
          if (!error) {
            Trades.upsert(trade.transactionHash, _.extend(block, trade, args));
          }
        });
      }
    }
  });
};

Offers.getBlock = function getBlock(blockNumber) {
  return new Promise((resolve, reject) => {
    web3.eth.getBlock(blockNumber, (blockError, block) => {
      if (!blockError) {
        resolve(block);
      } else {
        reject(blockError);
      }
    });
  });
};

Offers.getLowestOfferId = function getLowestOfferId(sellToken, buyToken) {
  const sellTokenAddress = dapp.getTokenAddress(sellToken);
  const buyTokenAddress = dapp.getTokenAddress(buyToken);

  return new Promise((resolve, reject) => {
    dapp['maker-otc'].objects.otc.getLowestOffer(sellTokenAddress, buyTokenAddress, (error, id) => {
      if (!error) {
        resolve(id);
      } else {
        reject(error);
      }
    });
  });
};

Offers.getHigherOfferId = function getHigherOfferId(existingId) {
  return new Promise((resolve, reject) => {
    dapp['maker-otc'].objects.otc.getHigherOfferId(existingId, (error, id) => {
      if (!error) {
        resolve(id);
      } else {
        reject(error);
      }
    });
  });
};

/**
 * Syncs up a single offer
 */
Offers.syncOffer = (id) => {
  dapp['maker-otc'].objects.otc.offers(id, (error, data) => {
    if (!error) {
      const idx = id.toString();
      const [sellHowMuch, sellWhichTokenAddress, buyHowMuch, buyWhichTokenAddress, owner, active] = data;

      if (active) {
        Offers.updateOffer(idx, sellHowMuch, sellWhichTokenAddress, buyHowMuch, buyWhichTokenAddress,
                           owner, Status.CONFIRMED);
      } else {
        Offers.remove(idx);
      }
    }
  });
};

Offers.updateOffer = (idx, sellHowMuch, sellWhichTokenAddress, buyHowMuch, buyWhichTokenAddress, owner, status) => {
  const sellToken = dapp.getTokenByAddress(sellWhichTokenAddress);
  const buyToken = dapp.getTokenByAddress(buyWhichTokenAddress);

  if (sellToken && buyToken) {
    let sellHowMuchValue = convertTo18Precision(sellHowMuch, sellToken);
    let buyHowMuchValue = convertTo18Precision(buyHowMuch, buyToken);
    if (!(sellHowMuchValue instanceof BigNumber)) {
      sellHowMuchValue = new BigNumber(sellHowMuchValue);
    }
    if (!(buyHowMuchValue instanceof BigNumber)) {
      buyHowMuchValue = new BigNumber(buyHowMuchValue);
    }

    const offer = {
      owner,
      status,
      helper: status === Status.PENDING ? 'Your new order is being placed...' : '',
      buyWhichTokenAddress,
      buyWhichToken: buyToken,
      sellWhichTokenAddress,
      sellWhichToken: sellToken,
      buyHowMuch: buyHowMuchValue.valueOf(),
      sellHowMuch: sellHowMuchValue.valueOf(),
      buyHowMuch_filter: buyHowMuchValue.toNumber(),
      sellHowMuch_filter: sellHowMuchValue.toNumber(),
      ask_price: buyHowMuchValue.div(sellHowMuchValue).valueOf(),
      bid_price: sellHowMuchValue.div(buyHowMuchValue).valueOf(),
      ask_price_sort: buyHowMuchValue.div(sellHowMuchValue).toNumber(),
      bid_price_sort: sellHowMuchValue.div(buyHowMuchValue).toNumber(),
    };

    Offers.upsert(idx, { $set: offer });
  }
};

Offers.offerContractParameters = (sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken) => {
  const sellWhichTokenAddress = dapp.getTokenAddress(sellWhichToken);
  const buyWhichTokenAddress = dapp.getTokenAddress(buyWhichToken);

  const sellHowMuchAbsolute = convertToTokenPrecision(sellHowMuch, sellWhichToken);
  const buyHowMuchAbsolute = convertToTokenPrecision(buyHowMuch, buyWhichToken);

  // the ID of the offer that is the smallest in the set of offers containing the offers that are higher,
  // than the offer to be created. If there are multiple offers that satisfy the previous requirement
  // than the one with the highest ID will be sent to the contract.
  const higherOrdersSorted = Offers.find({ buyWhichToken: buyWhichToken, sellWhichToken: sellWhichToken })
    .fetch()
    .filter((offer) => (offer._id.indexOf("0x") != 0))
    .filter((offer) => {
      const offerPrice = new BigNumber(offer.sellHowMuch).div(new BigNumber(offer.buyHowMuch));
      const specifiedPrice = new BigNumber(sellHowMuch).div(new BigNumber(buyHowMuch));
      return offerPrice.comparedTo(specifiedPrice) > 0;
    })
    .sort((offer1, offer2) => {
      const buyHowMuch1 = new BigNumber(offer1.buyHowMuch);
      const buyHowMuch2 = new BigNumber(offer2.buyHowMuch);
      if (buyHowMuch1.comparedTo(buyHowMuch2) != 0) return (buyHowMuch2.minus(buyHowMuch1).toNumber());
      else return (offer1._id - offer2._id);
    });
  const userHigherId = ((higherOrdersSorted.length > 0) ? higherOrdersSorted[higherOrdersSorted.length-1]._id : 0);

  console.log("Found " + higherOrdersSorted.length + " higher orders: " + higherOrdersSorted.map((it) => it._id));
  console.log("user_higher_id is " + userHigherId);

  return { sellHowMuchAbsolute, sellWhichTokenAddress, buyHowMuchAbsolute, buyWhichTokenAddress, userHigherId };
};

Offers.newOfferGasEstimate = async (sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken) => {
  const { sellHowMuchAbsolute, sellWhichTokenAddress, buyHowMuchAbsolute, buyWhichTokenAddress, userHigherId } =
    Offers.offerContractParameters(sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken);

  const data = dapp['maker-otc'].objects.otc.offer.getData(sellHowMuchAbsolute, sellWhichTokenAddress,
                                                             buyHowMuchAbsolute, buyWhichTokenAddress, userHigherId);

  const latestBlockPromise = Offers.getBlock('latest');
  const estimateGasPromise = new Promise((resolve, reject) => {
    web3.eth.estimateGas({to: dapp['maker-otc'].environments[dapp.env].otc.value, data: data}, (error, result) => {
      if (!error) {
        resolve(result);
      } else {
        reject(error);
      }
    });
  });

  return Promise.all([estimateGasPromise, latestBlockPromise]).then((results) => {
    return [results[0], results[1].gasLimit];
  });
};

Offers.newOffer = (sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken, callback) => {
  Offers.newOfferGasEstimate(sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken)
      .then((gasEstimate) => {
        const { sellHowMuchAbsolute, sellWhichTokenAddress, buyHowMuchAbsolute, buyWhichTokenAddress, userHigherId } =
          Offers.offerContractParameters(sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken);

        dapp['maker-otc'].objects.otc.offer(sellHowMuchAbsolute, sellWhichTokenAddress,
                                              buyHowMuchAbsolute, buyWhichTokenAddress, userHigherId,
          {gas: Math.min(gasEstimate[0] + 500000, gasEstimate[1])}, (error, tx) => {
            callback(error, tx);
            if (!error) {
              Offers.updateOffer(tx, sellHowMuchAbsolute, sellWhichTokenAddress, buyHowMuchAbsolute, buyWhichTokenAddress,
                web3.eth.defaultAccount, Status.PENDING);
              Transactions.add('offer', tx, {id: tx, status: Status.PENDING});
            }
          })
      })
      .catch((error) => callback(error));
};

Offers.cancelOffer = (idx) => {
  const id = parseInt(idx, 10);
  Offers.update(idx, { $unset: { helper: '' } });
  dapp['maker-otc'].objects.otc.cancel(id, { gas: CANCEL_GAS }, (error, tx) => {
    if (!error) {
      Transactions.add('offer', tx, { id: idx, status: Status.CANCELLED });
      Offers.update(idx, { $set: { tx, status: Status.CANCELLED, helper: 'The order is being cancelled...' } });
    } else {
      Offers.update(idx, { $set: { helper: formatError(error) } });
    }
  });
};

export { Offers, Trades, Status };

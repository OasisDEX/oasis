import { Mongo } from 'meteor/mongo';
import { Session } from 'meteor/session';
import { BigNumber } from 'meteor/ethereum:web3';
import { Dapple, web3Obj } from 'meteor/makerotc:dapple';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { moment } from 'meteor/momentjs:moment';

import Transactions from '/imports/api/transactions';
import { formatError } from '/imports/utils/functions';

import { convertToTokenPrecision, convertTo18Precision } from '/imports/utils/conversion';

const Offers = new Mongo.Collection(null);
const Trades = new Mongo.Collection(null);
const IndividualTrades = new Mongo.Collection(null);

const Status = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  BOUGHT: 'bought',
  OPEN: 'open',
  CLOSED: 'closed',
};

const BUY_GAS = 1000000;
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

function logTakeToTrade(logTake) {
  const buyWhichToken = Dapple.getTokenByAddress(logTake.args.buy_gem);
  const sellWhichToken = Dapple.getTokenByAddress(logTake.args.pay_gem);

  if (buyWhichToken && sellWhichToken && !logTake.removed) {
    return {
      buyWhichToken_address: logTake.args.buy_gem,
      buyWhichToken,
      sellWhichToken_address: logTake.args.pay_gem,
      sellWhichToken,
      buyHowMuch: convertTo18Precision(logTake.args.give_amt.toString(10), buyWhichToken),
      sellHowMuch: convertTo18Precision(logTake.args.take_amt.toString(10), sellWhichToken),
      timestamp: logTake.args.timestamp.toNumber(),
      transactionHash: logTake.transactionHash,
      issuer: logTake.args.maker,
      counterParty: logTake.args.taker,
    };
  }
  return false;
}

function getBlockNumberOfTheMostRecentBlock() {
  return Offers.getBlock('latest').then((block) => block.number);
}

function fetchIssuedTradesFor(address) {
  return new Promise((resolve, reject) => {
    Dapple['maker-otc'].objects.otc.LogTake({ maker: address }, {
      fromBlock: Dapple['maker-otc'].environments[Dapple.env].otc.blockNumber,
      toBlock: 'latest',
    }).get((error, logTakes) => {
      if (!error) {
        for (let i = 0; i < logTakes.length; i++) {
          const trade = logTakeToTrade(logTakes[i]);
          const eventLogIndex = logTakes[i].logIndex;
          if (trade) {
            const uniqueId = trade.transactionHash + eventLogIndex;
            IndividualTrades.upsert(uniqueId, trade);
          }
        }
        resolve();
      } else {
        // TODO: Display this to the user in a fixed error display panel
        console.debug('Cannot fetch issued trades');
        reject();
      }
    });
  });
}
function fetchAcceptedTradesFor(address) {
  return new Promise((resolve, reject) => {
    Dapple['maker-otc'].objects.otc.LogTake({ taker: address }, {
      fromBlock: Dapple['maker-otc'].environments[Dapple.env].otc.blockNumber,
      toBlock: 'latest',
    }).get((error, logTakes) => {
      if (!error) {
        for (let i = 0; i < logTakes.length; i++) {
          const currentTrade = logTakes[i].args;

          // We handle those scenario when we are filtering events base on maker property
          if (currentTrade.maker !== currentTrade.taker) {
            const trade = logTakeToTrade(logTakes[i]);
            const eventLogIndex = logTakes[i].logIndex;
            if (trade) {
              const uniqueId = trade.transactionHash + eventLogIndex;
              IndividualTrades.upsert(uniqueId, trade);
            }
          }
        }
        resolve();
      } else {
        // TODO: Display this to the user in a fixed error display panel
        console.debug('Cannot fetch accepted trades');
        reject();
      }
    });
  });
}

function listenForNewTradesOf(address) {
  getBlockNumberOfTheMostRecentBlock().then((latestBlock) => {
    Dapple['maker-otc'].objects.otc.LogTake({ maker: address },
      { fromBlock: latestBlock + 1 }, (error, logTake) => {
        if (!error) {
          const trade = logTakeToTrade(logTake);

          if (trade) {
            IndividualTrades.upsert(trade.transactionHash, trade);
          }
        }
      });
  });
}
function listenForAcceptedTradesOf(address) {
  getBlockNumberOfTheMostRecentBlock().then((latestBlock) => {
    Dapple['maker-otc'].objects.otc.LogTake({ taker: address },
      { fromBlock: latestBlock + 1 }, (error, logTake) => {
        if (!error) {
          if (logTake.args.maker !== logTake.args.taker) {
            const trade = logTakeToTrade(logTake);

            if (trade) {
              IndividualTrades.upsert(trade.transactionHash, trade);
            }
          }
        }
      });
  });
}
function listenForNewSortedOrders() {
  Dapple['maker-otc'].objects.otc.LogSortedOffer((err, result) => {
    if (!err) {
      const id = result.args.id.toNumber();
      Offers.syncOffer(id);
      Offers.remove(result.transactionHash);
    } else {
      console.debug('Error placing new sorted offer!', err);
    }
  });
}
function listenForFilledOrCancelledOrders() {
  /** When the order matching is activated we are using ItemUpdate only to listen for events
   * where a given order is getting cancelled or filled in ( in case of `buy` being enabled.*/
  Dapple['maker-otc'].objects.otc.LogItemUpdate((err, result) => {
    if (!err) {
      const idx = result.args.id;
      Dapple['maker-otc'].objects.otc.offers(idx.toNumber(), (error, data) => {
        if (!error) {
          const offer = Offers.findOne({ _id: idx.toString() });

          if (offer) {
            const [, , , , , active] = data;
            Offers.syncOffer(idx.toNumber());
            /**
             * When the order matching is enabled there is check on the contract side
             * before the creating new order.
             * It checks if the new order is about to match existing one. There are couple of scenarios:
             *
             *  - New order is filled in completely but the existing one is completed partially or completely
             *    = then no order is actually created on the blockchain so the UI has offer is transaction id only.
             *
             *  - New order is not filled in completely but fills the existing one completely
             *    = then new order is created with the remainings after the matching is done.
             *
             * Transaction hash of the event in the first case scenario, corresponds to the transaction hash,
             * used to store the offer on the client. In order to update the UI accordingly, when the first scenario is met
             * we used the transaction has to remove the new order from the collection.
             * */
            Offers.remove(result.transactionHash);
            if (!active) {
              Offers.remove(idx.toString());
            }
          }
        }
      });
    }
  });
}

Offers.syncedOffers = [];
window.Offers = Offers;

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
IndividualTrades.helpers(helpers);

/**
 * Get if market is open
 */
Offers.checkMarketOpen = () => {
  // Fetch the market close time
  Dapple['maker-otc'].objects.otc.close_time((error, t) => {
    if (!error) {
      const closeTime = t.toNumber();
      Session.set('close_time', closeTime);
    }
  });
  Dapple['maker-otc'].objects.otc.isClosed((error, t) => {
    if (!error) {
      Session.set('market_open', !t);
    }
  });
};

Offers.getHistoricalTradesRange = (numberOfPreviousDays) => {
  // after the initial jump we step back 1000 blocks at a time
  // We send one extra day just to have a buffer and be sure that the starBlock covers a full week of volume data
  const INITIAL_NUMBER_OF_BLOCKS_BACKWARDS = Session.get('AVGBlocksPerDay') * (numberOfPreviousDays + 1 + 1);

  return getBlockNumberOfTheMostRecentBlock().then((blockNumberOfTheMostRecentBlock) => {
    const startTimestamp = moment(Date.now()).startOf('day').subtract(numberOfPreviousDays, 'days');
    const initialGuess = blockNumberOfTheMostRecentBlock - INITIAL_NUMBER_OF_BLOCKS_BACKWARDS;

    const ret = {
      startBlockNumber: initialGuess,
      startTimestamp,
      endBlockNumber: blockNumberOfTheMostRecentBlock,
    };
    return ret;
  });
};

/**
 * Syncs up all offers and trades
 */
Offers.sync = () => {
  Offers.checkMarketOpen();
  Offers.syncOffers();
  // As it is expensive to load historical Trades, we load them only for the last week
  // Enough for the Volume chart and the Market History section
  Offers.getHistoricalTradesRange(6).then(Offers.syncTrades);
};

Offers.syncOffers = () => {
  Offers.remove({});
  Session.set('loadingCounter', 0);
  Session.set('offersCount', 0);

  // Watch ItemUpdate Event
  /* eslint new-cap: ["error", { "capIsNewExceptions": ["ItemUpdate", "Trade", "LogTake"] }] */

  function cartesianProduct(arr) {
    return arr.reduce((a, b) => a.map((x) => b.map((y) => x.concat(y))).reduce((a, b) => a.concat(b), []), [[]]);
  }

  function flatten(ary) {
    return ary.reduce((a, b) => {
      if (Array.isArray(b)) {
        return a.concat(flatten(b));
      }
      return a.concat(b);
    }, []);
  }

  const getNextOffer = (id, error) => {
    if (!error) {
      const loaded = Session.get('loadingCounter') + 1;
      const total = Session.get('offersCount');
      Session.set('loadingCounter', loaded);

      if (loaded === total) {
        Offers.syncOffer(id.toString(10));
      } else {
        Offers.syncOffer(id.toString(10), total);
      }
      Dapple['maker-otc'].objects.otc.getWorseOffer(id.toString(10), (err, nextId) => {
        if (!err && !nextId.eq(0)) {
          getNextOffer(nextId);
        }
      });
    } else {
      console.debug('Trouble getting next offer: ', error);
    }
  };

  const getOffersCount = (quote, base) => {
    const quoteAddress = Dapple.getTokenAddress(quote);
    const baseAddress = Dapple.getTokenAddress(base);

    function requestOffersFor(firstCurrency, secondCurrency) {
      return new Promise((resolve, reject) => {
        Dapple['maker-otc'].objects.otc.getOfferCount(firstCurrency, secondCurrency, (err, count) => {
          if (!err) {
            resolve(count);
          } else {
            reject(err);
          }
        });
      });
    }

    const bidOffersRequest = requestOffersFor(quoteAddress, baseAddress);
    const askOffersRequest = requestOffersFor(baseAddress, quoteAddress);

    return Promise.all([bidOffersRequest, askOffersRequest]);
  };

  const isMatchingEnabled = Session.get('isMatchingEnabled');

  Session.set('loadingBuyOrders', true);
  Session.set('loadingSellOrders', true);

  if (isMatchingEnabled) {
    Session.set('loading', true);
    Session.set('loadingProgress', 0);
    Offers.syncedOffers = [];
    const quoteToken = Session.get('quoteCurrency');
    const baseToken = Session.get('baseCurrency');
    getOffersCount(quoteToken, baseToken).then((count) => {
      Session.set('offersCount', parseInt(count[0], 10) + parseInt(count[1], 10)); // combining both ask and bid offers for a given pair
      Offers.getBestOffer(quoteToken, baseToken).then(getNextOffer);
      Offers.getBestOffer(baseToken, quoteToken).then(getNextOffer);
    });

    listenForNewSortedOrders();
    listenForFilledOrCancelledOrders();
  } else {
    Dapple['maker-otc'].objects.otc.LogItemUpdate((err, result) => {
      if (!err) {
        const id = result.args.id.toNumber();
        Offers.syncOffer(id);
        Offers.remove(result.transactionHash);
        if (Session.equals('selectedOffer', result.transactionHash)) {
          Session.set('selectedOffer', id.toString());
        }
      }
    });

    Dapple['maker-otc'].objects.otc.last_offer_id((err, n) => {
      if (!err) {
        const lastOfferId = n.toNumber();
        console.log('last_offer_id', lastOfferId);
        if (lastOfferId > 0) {
          Session.set('loading', true);
          Session.set('loadingProgress', 0);
          for (let i = lastOfferId; i >= 1; i--) {
            Offers.syncOffer(i, lastOfferId);
          }
        } else {
          Session.set('loading', false);
          Session.set('loadingProgress', 100);
          Session.set('loadingBuyOrders', false);
          Session.set('loadingSellOrders', false);
        }
      }
    });
  }
};

Offers.syncIndividualTrades = () => {
  const address = Session.get('address');
  const fetchIssuedTrades = fetchIssuedTradesFor(address);
  const fetchAcceptedTrades = fetchAcceptedTradesFor(address);

  Promise.all([fetchIssuedTrades, fetchAcceptedTrades]).then(() => {
    Session.set('areIndividualTradesSynced', true);
    Session.set('loadingIndividualTradeHistory', false);

    listenForNewTradesOf(address);
    listenForAcceptedTradesOf(address);
  });
};

Offers.syncTrades = (historicalTradesRange) => {
  // Get all LogTake events in one go so we can fill up prices, volume and trade history
  Dapple['maker-otc'].objects.otc.LogTake({}, {
    fromBlock: historicalTradesRange.startBlockNumber,
    toBlock: historicalTradesRange.endBlockNumber,
  }).get((error, logTakes) => {
    if (!error) {
      for (let i = 0; i < logTakes.length; i++) {
        // Since we have the transactionHash the same for 2 LogTake events because two orders were filled automatically
        // We use each log event index to create unique ids for the log entry in the db.
        const eventLogIndex = logTakes[i].logIndex;
        const trade = logTakeToTrade(logTakes[i]);
        if (trade && (trade.timestamp * 1000 >= historicalTradesRange.startTimestamp)) {
          const uniqueId = trade.transactionHash + eventLogIndex;
          Trades.upsert(uniqueId, trade);
        }
      }
      Session.set('loadingTradeHistory', false);
    }
  });

  // Watch LogTake events in realtime
  Dapple['maker-otc'].objects.otc.LogTake({},
    { fromBlock: historicalTradesRange.endBlockNumber + 1 }, (error, logTake) => {
      if (!error) {
        const trade = logTakeToTrade(logTake);
        if (trade) {
          const uniqueId = trade.transactionHash + logTake.logIndex;
          Trades.upsert(uniqueId, trade);
        }
      }
    });
};

Offers.getBlock = function getBlock(blockNumber) {
  return new Promise((resolve, reject) => {
    web3Obj.eth.getBlock(blockNumber, (blockError, block) => {
      if (!blockError) {
        resolve(block);
      } else {
        reject(blockError);
      }
    });
  });
};

Offers.getBestOffer = (sellToken, buyToken) => {
  const sellTokenAddress = Dapple.getTokenAddress(sellToken);
  const buyTokenAddress = Dapple.getTokenAddress(buyToken);

  return new Promise((resolve, reject) => {
    Dapple['maker-otc'].objects.otc.getBestOffer(sellTokenAddress, buyTokenAddress, (error, id) => {
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
    Dapple['maker-otc'].objects.otc.getHigherOfferId(existingId, (error, id) => {
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
Offers.syncOffer = (id, max = 0) => {
  const isBuyEnabled = Session.get('isBuyEnabled');
  const base = Session.get('baseCurrency');

  const clearLoadingIndicators = () => {
    Session.set('loading', false);
    Session.set('loadingBuyOrders', false);
    Session.set('loadingSellOrders', false);
    Session.set('loadingCounter', 0);
    Session.set('loadingProgress', 100);
  };
  Dapple['maker-otc'].objects.otc.offers(id, (error, data) => {
    if (!error) {
      const idx = id.toString();
      const [sellHowMuch, sellWhichTokenAddress, buyHowMuch, buyWhichTokenAddress, owner, timestamp] = data;
      const sellToken = Dapple.getTokenByAddress(sellWhichTokenAddress);
      if (sellToken === base && Session.get('loadingBuyOrders')) {
        Session.set('loadingBuyOrders', false);
      } else if (Session.get('loadingSellOrders')) {
        Session.set('loadingSellOrders', false);
      }
      if (timestamp.valueOf() > 0) {
        Offers.updateOffer(idx, sellHowMuch, sellWhichTokenAddress, buyHowMuch, buyWhichTokenAddress,
          owner, Status.CONFIRMED);
      } else {
        Offers.remove(idx);
        if (isBuyEnabled && Session.equals('selectedOffer', idx)) {
          $('#offerModal').modal('hide');
        }
      }
      Offers.syncedOffers.push(id);
      if (max > 0 && id > 1) {
        Session.set('loadingProgress', Math.round(100 * (Offers.syncedOffers.length / max)));
      } else {
        clearLoadingIndicators();
      }
    } else {
      clearLoadingIndicators();
    }
  });
};

Offers.updateOffer = (idx, sellHowMuch, sellWhichTokenAddress, buyHowMuch, buyWhichTokenAddress, owner, status) => {
  const sellToken = Dapple.getTokenByAddress(sellWhichTokenAddress);
  const buyToken = Dapple.getTokenByAddress(buyWhichTokenAddress);
  const precision = Session.get('precision');

  if (sellToken && buyToken) {
    let sellHowMuchValue = convertTo18Precision(sellHowMuch, sellToken);
    let buyHowMuchValue = convertTo18Precision(buyHowMuch, buyToken);
    if (!(sellHowMuchValue instanceof BigNumber)) {
      sellHowMuchValue = new BigNumber(sellHowMuchValue, 10);
    }
    if (!(buyHowMuchValue instanceof BigNumber)) {
      buyHowMuchValue = new BigNumber(buyHowMuchValue, 10);
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
      ask_price_sort: new BigNumber(buyHowMuchValue.div(sellHowMuchValue).toFixed(precision < 5 ? 5 : precision, 6), 10).toNumber(),
      bid_price_sort: new BigNumber(sellHowMuchValue.div(buyHowMuchValue).toFixed(precision < 5 ? 5 : precision, 6), 10).toNumber(),
    };
    Offers.upsert(idx, { $set: offer });
  }
};
Offers.offerContractParameters = (sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken) => {
  const sellWhichTokenAddress = Dapple.getTokenAddress(sellWhichToken);
  const buyWhichTokenAddress = Dapple.getTokenAddress(buyWhichToken);

  const sellHowMuchAbsolute = convertToTokenPrecision(sellHowMuch, sellWhichToken);
  const buyHowMuchAbsolute = convertToTokenPrecision(buyHowMuch, buyWhichToken);

  // the ID of the offer that is the smallest in the set of offers containing the offers that are higher,
  // than the offer to be created. If there are multiple offers that satisfy the previous requirement
  // than the one with the highest ID will be sent to the contract.
  const higherOrdersSorted = Offers.find({ buyWhichToken, sellWhichToken })
    .fetch()
    .filter((offer) => (offer._id.indexOf('0x') !== 0))
    .filter((offer) => {
      const offerPrice = new BigNumber(`${offer.sellHowMuch}`).div(new BigNumber(`${offer.buyHowMuch}`));
      const specifiedPrice = new BigNumber(sellHowMuch.toString()).div(new BigNumber(buyHowMuch));
      return offerPrice.comparedTo(specifiedPrice) >= 0;
    })
    .sort((offer1, offer2) => {
      const buyHowMuch1 = new BigNumber(`${offer1.buyHowMuch}`);
      const buyHowMuch2 = new BigNumber(`${offer2.buyHowMuch}`);
      if (buyHowMuch1.comparedTo(buyHowMuch2) !== 0) return (buyHowMuch2.minus(buyHowMuch1).toNumber());
      return (offer1._id - offer2._id);
    });
  const userHigherId = ((higherOrdersSorted.length > 0) ? higherOrdersSorted[higherOrdersSorted.length - 1]._id : 0);

  console.log(`Found ${higherOrdersSorted.length} higher orders: ${higherOrdersSorted.map((it) => it._id)}`);
  console.log(`user_higher_id is ${userHigherId}`);

  return { sellHowMuchAbsolute, sellWhichTokenAddress, buyHowMuchAbsolute, buyWhichTokenAddress, userHigherId };
};

Offers.newOfferGasEstimate = async (sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken) => {
  const { sellHowMuchAbsolute, sellWhichTokenAddress, buyHowMuchAbsolute, buyWhichTokenAddress, userHigherId } =
    Offers.offerContractParameters(sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken);

  const data = Dapple['maker-otc'].objects.otc.offer['uint256,address,uint256,address,uint256,bool'].getData(sellHowMuchAbsolute, sellWhichTokenAddress,
    buyHowMuchAbsolute, buyWhichTokenAddress, userHigherId, true);

  const latestBlockPromise = Offers.getBlock('latest');
  const estimateGasPromise = new Promise((resolve, reject) => {
    web3Obj.eth.estimateGas({ to: Dapple['maker-otc'].environments[Dapple.env].otc.value, data }, (error, result) => {
      if (!error) {
        resolve(result);
      } else {
        reject(error);
      }
    });
  });

  return Promise.all([estimateGasPromise, latestBlockPromise]).then((results) => [results[0], results[1].gasLimit]);
};

Offers.fillOfferGasEstimate = (id, quantity) => {
  const data = Dapple['maker-otc'].objects.otc.buy.getData(id, quantity);

  const latestBlock = Offers.getBlock('latest');
  const estimation = new Promise((resolve, reject) => {
    web3Obj.eth.estimateGas({ to: Dapple['maker-otc'].environments[Dapple.env].otc.value, data }, (error, result) => {
      if (!error) {
        resolve(result);
      } else {
        console.log(error);
        reject(error);
      }
    });
  });

  return Promise.all([estimation, latestBlock]).then((results) =>
    ({ quantity: results[0], limit: results[1].gasLimit }),
  );
};

Offers.newOffer = (sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken, callback) => {
  Offers.newOfferGasEstimate(sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken)
    .then((gasEstimate) => {
      const { sellHowMuchAbsolute, sellWhichTokenAddress, buyHowMuchAbsolute, buyWhichTokenAddress, userHigherId } =
        Offers.offerContractParameters(sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken);
      Dapple['maker-otc'].objects.otc.offer['uint256,address,uint256,address,uint256,bool'](sellHowMuchAbsolute, sellWhichTokenAddress,
        buyHowMuchAbsolute, buyWhichTokenAddress, userHigherId, true,
        { gas: Math.min(gasEstimate[0] + 500000, gasEstimate[1]) }, (error, tx) => {
          callback(error, tx);
          if (!error) {
            Offers.updateOffer(tx, sellHowMuchAbsolute, sellWhichTokenAddress, buyHowMuchAbsolute, buyWhichTokenAddress,
              web3Obj.eth.defaultAccount, Status.PENDING);
            Transactions.add('offer', tx, { id: tx, status: Status.PENDING });
          }
        });
    })
    .catch((error) => callback(error));
};

Offers.buyOffer = (_id, type, _quantity, _token) => {
  const quantityAbsolute = convertToTokenPrecision(_quantity, _token);

  Offers.fillOfferGasEstimate(_id, quantityAbsolute).then((estimated) => {
    Offers.update(_id, { $unset: { helper: '' } });
    const estimatedGas = Math.min(estimated.quantity + 500000, estimated.limit);
    Dapple['maker-otc'].objects.otc.buy(_id, quantityAbsolute, { gas: estimatedGas }, (error, tx) => {
      if (!error) {
        Transactions.add('offer', tx, { id: _id, status: Status.BOUGHT });
        Offers.update(_id, {
          $set: {
            tx, status: Status.BOUGHT, helper: `Your ${type} order is being processed...`,
          },
        });
      } else {
        Offers.update(_id, { $set: { helper: formatError(error) } });
      }
    });
  });
};

Offers.cancelOffer = (idx) => {
  const id = parseInt(idx, 10);
  Offers.update(idx, { $unset: { helper: '' } });
  Dapple['maker-otc'].objects.otc.cancel(id, { gas: CANCEL_GAS }, (error, tx) => {
    if (!error) {
      Transactions.add('offer', tx, { id: idx, status: Status.CANCELLED });
      Offers.update(idx, { $set: { tx, status: Status.CANCELLED, helper: 'The order is being cancelled...' } });
    } else {
      Offers.update(idx, { $set: { helper: formatError(error) } });
    }
  });
};
export { Offers, Trades, IndividualTrades, Status };

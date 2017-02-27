import { Mongo } from 'meteor/mongo';
import { Session } from 'meteor/session';
import { BigNumber } from 'meteor/ethereum:web3';
import { Dapple, web3 } from 'meteor/makerotc:dapple';
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
  BOUGHT: 'bought',
};

const OFFER_GAS = 1000000;
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

Offers.syncedOffers = [];

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
  Dapple['maker-otc'].objects.otc.close_time((error, t) => {
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
    return Offers.getBlock(startingFrom).then((block) => {
      if (block.timestamp*1000 <= timestamp) {
        return block.number;
      }
      else {
        return getBlockNumberOfSomeBlockEarlierThan(startingFrom-STEP_NUMBER_OF_BLOCKS_BACKWARDS, timestamp);
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
  Dapple['maker-otc'].objects.otc.ItemUpdate((error, result) => {
    if (!error) {
      const id = result.args.id.toNumber();
      Offers.syncOffer(id);
      Offers.remove(result.transactionHash);
      if (Session.equals('selectedOffer', result.transactionHash)) {
        Session.set('selectedOffer', id.toString());
      }
    }
  });

  // Sync all past offers
  Dapple['maker-otc'].objects.otc.last_offer_id((error, n) => {
    if (!error) {
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
      }
    }
  });
};

Offers.syncTrades = (historicalTradesRange) => {
  function transformArgs(trade) {
    const buyWhichToken = Dapple.getTokenByAddress(trade.args.buy_which_token);
    const sellWhichToken = Dapple.getTokenByAddress(trade.args.sell_which_token);

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
  Dapple['maker-otc'].objects.otc.Trade({}, { fromBlock: historicalTradesRange.startBlockNumber,
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
  Dapple['maker-otc'].objects.otc.Trade({}, { fromBlock: historicalTradesRange.endBlockNumber+1 }, (error, trade) => {
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
  const p = new Promise((resolve, reject) => {
    web3.eth.getBlock(blockNumber, (blockError, block) => {
      if (!blockError) {
        resolve(block);
      } else {
        reject(blockError);
      }
    });
  });
  return p;
};


/**
 * Syncs up a single offer
 */
Offers.syncOffer = (id, max = 0) => {
  Dapple['maker-otc'].objects.otc.offers(id, (error, data) => {
    if (!error) {
      const idx = id.toString();
      const [sellHowMuch, sellWhichTokenAddress, buyHowMuch, buyWhichTokenAddress, owner, active] = data;

      if (active) {
        Offers.updateOffer(idx, sellHowMuch, sellWhichTokenAddress, buyHowMuch, buyWhichTokenAddress,
                           owner, Status.CONFIRMED);
      } else {
        Offers.remove(idx);
        if (Session.equals('selectedOffer', idx)) {
          $('#offerModal').modal('hide');
        }
      }
      Offers.syncedOffers.push(id);

      if (max > 0 && id > 1) {
        Session.set('loadingProgress', Math.round(100 * (Offers.syncedOffers.length / max)));
      } else {
        Session.set('loading', false);
        Session.set('loadingProgress', 100);
      }
    }
  });
};

Offers.updateOffer = (idx, sellHowMuch, sellWhichTokenAddress, buyHowMuch, buyWhichTokenAddress, owner, status) => {
  const sellToken = Dapple.getTokenByAddress(sellWhichTokenAddress);
  const buyToken = Dapple.getTokenByAddress(buyWhichTokenAddress);

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

Offers.newOffer = (sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken, callback) => {
  const sellWhichTokenAddress = Dapple.getTokenAddress(sellWhichToken);
  const buyWhichTokenAddress = Dapple.getTokenAddress(buyWhichToken);

  const sellHowMuchAbsolute = convertToTokenPrecision(sellHowMuch, sellWhichToken);
  const buyHowMuchAbsolute = convertToTokenPrecision(buyHowMuch, buyWhichToken);

  Dapple['maker-otc'].objects.otc.offer(sellHowMuchAbsolute, sellWhichTokenAddress,
                                        buyHowMuchAbsolute, buyWhichTokenAddress,
    { gas: OFFER_GAS }, (error, tx) => {
      callback(error, tx);
      if (!error) {
        Offers.updateOffer(tx, sellHowMuchAbsolute, sellWhichTokenAddress, buyHowMuchAbsolute, buyWhichTokenAddress,
                           web3.eth.defaultAccount, Status.PENDING);
        Transactions.add('offer', tx, { id: tx, status: Status.PENDING });
      }
    });
};

Offers.buyOffer = (_id, type, _quantity, _token) => {
  const id = parseInt(_id, 10);

  const quantityAbsolute = convertToTokenPrecision(_quantity, _token);

  Offers.update(_id, { $unset: { helper: '' } });
  Dapple['maker-otc'].objects.otc.buy(id.toString(10), quantityAbsolute, { gas: BUY_GAS }, (error, tx) => {
    if (!error) {
      Transactions.add('offer', tx, { id: _id, status: Status.BOUGHT });
      Offers.update(_id, { $set: {
        tx, status: Status.BOUGHT, helper: `Your ${type} order is being processed...` } });
    } else {
      Offers.update(_id, { $set: { helper: formatError(error) } });
    }
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

export { Offers, Trades, Status };

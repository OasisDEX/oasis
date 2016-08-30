import { Mongo } from 'meteor/mongo';
import { Session } from 'meteor/session';
import { BigNumber } from 'meteor/ethereum:web3';
import { Dapple, web3 } from 'meteor/makerotc:dapple';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

import Transactions from '/imports/api/transactions';

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

const TRADES_LIMIT = 7;
Session.set('lastTradesLimit', TRADES_LIMIT);

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
      price = new BigNumber(this.buyHowMuch).div(new BigNumber(this.sellHowMuch)).toString(10);
    } else if (this.buyWhichToken === baseCurrency && this.sellWhichToken === quoteCurrency) {
      price = new BigNumber(this.sellHowMuch).div(new BigNumber(this.buyHowMuch)).toString(10);
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
}));

Trades.helpers(helpers);

/**
 * Syncs up all offers and trades
 */
Offers.sync = () => {
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

  // Fetch the market close time
  Dapple['maker-otc'].objects.otc.close_time((error, t) => {
    if (!error) {
      const closeTime = t.toNumber();
      Session.set('close_time', closeTime);
      Session.set('market_open', closeTime > (new Date() / 1000));
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
        Offers.syncOffer(lastOfferId, lastOfferId);
      }
    }
  });

  // Watch Trade events
  Dapple['maker-otc'].objects.otc.Trade({}, { fromBlock: Dapple.getFirstContractBlock() }, (error, trade) => {
    if (!error) {
      // Transform arguments
      const args = {
        buyWhichToken_address: trade.args.buy_which_token,
        buyWhichToken: Dapple.getTokenByAddress(trade.args.buy_which_token),
        sellWhichToken_address: trade.args.sell_which_token,
        sellWhichToken: Dapple.getTokenByAddress(trade.args.sell_which_token),
        buyHowMuch: trade.args.buy_how_much.toString(10),
        sellHowMuch: trade.args.sell_how_much.toString(10),
      };
      // Get block for timestamp
      web3.eth.getBlock(trade.blockNumber, (blockError, block) => {
        if (!error) {
          Trades.upsert(trade.transactionHash, _.extend(block, trade, args));
        }
      });
    }
  });
};

/**
 * Syncs up a single offer
 */
Offers.syncOffer = (id, max) => {
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
      if (max > 0 && id > 1) {
        Session.set('loadingProgress', Math.round(100 * ((max - id) / max)));
        Offers.syncOffer(id - 1, max);
      } else if (max > 0) {
        Session.set('loading', false);
      }
    }
  });
};

Offers.updateOffer = (idx, sellHowMuch, sellWhichTokenAddress, buyHowMuch, buyWhichTokenAddress, owner, status) => {
  let sellHowMuchValue = sellHowMuch;
  let buyHowMuchValue = buyHowMuch;
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
    buyWhichToken: Dapple.getTokenByAddress(buyWhichTokenAddress),
    sellWhichTokenAddress,
    sellWhichToken: Dapple.getTokenByAddress(sellWhichTokenAddress),
    buyHowMuch: buyHowMuchValue.toString(10),
    sellHowMuch: sellHowMuchValue.toString(10),
    ask_price: buyHowMuchValue.div(sellHowMuchValue).toNumber(),
    bid_price: sellHowMuchValue.div(buyHowMuchValue).toNumber(),
  };

  Offers.upsert(idx, { $set: offer });
};

Offers.newOffer = (sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken, callback) => {
  const sellWhichTokenAddress = Dapple.getTokenAddress(sellWhichToken);
  const buyWhichTokenAddress = Dapple.getTokenAddress(buyWhichToken);

  Dapple['maker-otc'].objects.otc.offer(sellHowMuch, sellWhichTokenAddress, buyHowMuch, buyWhichTokenAddress,
    { gas: OFFER_GAS }, (error, tx) => {
      callback(error, tx);
      if (!error) {
        Offers.updateOffer(tx, sellHowMuch, sellWhichTokenAddress, buyHowMuch, buyWhichTokenAddress,
                           web3.eth.defaultAccount, Status.PENDING);
        Transactions.add('offer', tx, { id: tx, status: Status.PENDING });
      }
    });
};

Offers.buyOffer = (_id, _quantity) => {
  const id = parseInt(_id, 10);
  Offers.update(_id, { $unset: { helper: '' } });
  Dapple['maker-otc'].objects.otc.buy(id.toString(10), _quantity, { gas: BUY_GAS }, (error, tx) => {
    if (!error) {
      Transactions.add('offer', tx, { id: _id, status: Status.BOUGHT });
      Offers.update(_id, { $set: {
        tx, status: Status.BOUGHT, helper: 'Your buy / sell order is being processed...' } });
    } else {
      Offers.update(_id, { $set: { helper: error.toString() } });
    }
  });
};

Offers.cancelOffer = (idx) => {
  const id = parseInt(idx, 10);
  Offers.update(idx, { $unset: { helper: '' } });
  Dapple['maker-otc'].objects.otc.cancel(id, { gas: CANCEL_GAS }, (error, tx) => {
    if (!error) {
      Transactions.add('offer', tx, { id: idx, status: Status.CANCELLED });
      Offers.update(idx, { $set: { tx, status: Status.CANCELLED, helper: 'Your order is being cancelled...' } });
    } else {
      Offers.update(idx, { $set: { helper: error.toString() } });
    }
  });
};

export { Offers, Trades, Status };

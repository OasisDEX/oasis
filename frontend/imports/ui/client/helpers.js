import { Session } from 'meteor/session';
import { Spacebars } from 'meteor/spacebars';
import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { BigNumber } from 'meteor/ethereum:web3';
import { EthTools } from 'meteor/ethereum:tools';
import { Dapple, web3 } from 'meteor/makerotc:dapple';

import Tokens from '/imports/api/tokens';
import { Offers, Trades } from '/imports/api/offers';

Template.registerHelper('contractExists', () => {
  const network = Session.get('network');
  const isConnected = Session.get('isConnected');
  const exists = Session.get('contractExists');
  return network !== false && isConnected === true && exists === true;
});

Template.registerHelper('network', () => Session.get('network'));

Template.registerHelper('contractAddress', () => {
  let contractAddress = '';
  if (Dapple['maker-otc'].objects) {
    contractAddress = Dapple['maker-otc'].objects.otc.address;
  }
  return contractAddress;
});

Template.registerHelper('contractHref', () => {
  let contractHref = '';
  if (Dapple['maker-otc'].objects) {
    const network = Session.get('network');
    const networkPrefix = (network === 'test' ? 'testnet.' : '');
    const contractAddress = Dapple['maker-otc'].objects.otc.address;
    contractHref = `https://${networkPrefix}etherscan.io/address/${contractAddress}`;
  }
  return contractHref;
});

Template.registerHelper('marketCloseTime', () => Session.get('close_time'));

Template.registerHelper('isMarketOpen', () => Session.get('market_open'));

Template.registerHelper('ready', () =>
  Session.get('isConnected') && !Session.get('syncing') && !Session.get('outOfSync')
);

Template.registerHelper('isConnected', () => Session.get('isConnected'));

Template.registerHelper('outOfSync', () => Session.get('outOfSync'));

Template.registerHelper('syncing', () => Session.get('syncing'));

Template.registerHelper('syncingPercentage', () => {
  const startingBlock = Session.get('startingBlock');
  const currentBlock = Session.get('currentBlock');
  const highestBlock = Session.get('highestBlock');
  return Math.round(100 * ((currentBlock - startingBlock) / (highestBlock - startingBlock)));
});

Template.registerHelper('loading', () => Session.get('loading'));

Template.registerHelper('loadingProgress', () => Session.get('loadingProgress'));

Template.registerHelper('address', () => Session.get('address'));

Template.registerHelper('ETHBalance', () => Session.get('ETHBalance'));

Template.registerHelper('allTokens', () => {
  const quoteCurrency = Session.get('quoteCurrency');
  const baseCurrency = Session.get('baseCurrency');
  return _.uniq([quoteCurrency, baseCurrency]).map((token) => Tokens.findOne(token));
});

Template.registerHelper('findToken', (token) => Tokens.findOne(token));

Template.registerHelper('countLastTrades', () => {
  const quoteCurrency = Session.get('quoteCurrency');
  const baseCurrency = Session.get('baseCurrency');
  const options = {};
  options.sort = { blockNumber: -1, transactionIndex: -1 };
  const obj = { $or: [
    { buyWhichToken: quoteCurrency, sellWhichToken: baseCurrency },
    { buyWhichToken: baseCurrency, sellWhichToken: quoteCurrency },
  ] };
  return Trades.find(obj, options).count();
});

Template.registerHelper('lastTrades', () => {
  const quoteCurrency = Session.get('quoteCurrency');
  const baseCurrency = Session.get('baseCurrency');
  const limit = Session.get('lastTradesLimit');
  const options = {};
  if (limit) {
    options.limit = limit;
  }
  options.sort = { blockNumber: -1, transactionIndex: -1 };
  const obj = { $or: [
    { buyWhichToken: quoteCurrency, sellWhichToken: baseCurrency },
    { buyWhichToken: baseCurrency, sellWhichToken: quoteCurrency },
  ] };
  return Trades.find(obj, options);
});

Template.registerHelper('countOffers', (type) => {
  const quoteCurrency = Session.get('quoteCurrency');
  const baseCurrency = Session.get('baseCurrency');
  const options = {};
  options.sort = { ask_price: 1 };

  if (type === 'ask') {
    return Offers.find({ buyWhichToken: quoteCurrency, sellWhichToken: baseCurrency }, options).count();
  } else if (type === 'bid') {
    return Offers.find({ buyWhichToken: baseCurrency, sellWhichToken: quoteCurrency }, options).count();
  }
  return 0;
});

Template.registerHelper('findOffers', (type) => {
  const quoteCurrency = Session.get('quoteCurrency');
  const baseCurrency = Session.get('baseCurrency');
  const limit = Session.get('orderBookLimit');

  const options = {};
  options.sort = { ask_price: 1 };
  if (limit) {
    options.limit = limit;
  }

  if (type === 'ask') {
    return Offers.find({ buyWhichToken: quoteCurrency, sellWhichToken: baseCurrency }, options);
  } else if (type === 'bid') {
    return Offers.find({ buyWhichToken: baseCurrency, sellWhichToken: quoteCurrency }, options);
  } else if (type === 'mine') {
    const or = [
      { buyWhichToken: quoteCurrency, sellWhichToken: baseCurrency },
      { buyWhichToken: baseCurrency, sellWhichToken: quoteCurrency },
    ];
    const address = Session.get('address');
    return Offers.find({ owner: address, $or: or });
  }
  return [];
});

Template.registerHelper('findOffer', (id) => Offers.findOne(id));

Template.registerHelper('selectedOffer', () => Session.get('selectedOffer'));

Template.registerHelper('quoteCurrency', () => Session.get('quoteCurrency'));

Template.registerHelper('baseCurrency', () => Session.get('baseCurrency'));

Template.registerHelper('equals', (a, b) => a === b);

Template.registerHelper('not', (b) => !b);

Template.registerHelper('concat', (...args) => Array.prototype.slice.call(args, 0, -1).join(''));

Template.registerHelper('timestampToString', (ts, inSeconds) => {
  let timestampStr = '';
  if (ts) {
    if (inSeconds === true) {
      timestampStr = new Date(1000 * ts).toLocaleString();
    } else {
      timestampStr = new Date(ts).toLocaleString();
    }
  }
  return timestampStr;
});

Template.registerHelper('fromWei', (s) => web3.fromWei(s));

Template.registerHelper('toWei', (s) => web3.toWei(s));

Template.registerHelper('formatBalance', (wei, format) => {
  let formatValue = format;
  if (formatValue instanceof Spacebars.kw) {
    formatValue = null;
  }
  formatValue = formatValue || '0,0.00[0000]';

  return EthTools.formatBalance(wei, formatValue);
});

Template.registerHelper('formatPrice', (value, currency) => {
  let displayValue = value;
  const format = '0,0.00[0000]';
  try {
    if (!(displayValue instanceof BigNumber)) {
      displayValue = new BigNumber(displayValue);
    }

    if (currency === 'ETH') {
      const usd = EthTools.ticker.findOne('usd');
      if (usd) {
        const usdValue = displayValue.times(usd.price);
        const usdBalance = EthTools.formatBalance(usdValue, format);
        return `(~${usdBalance} USD)`;
      }
    }
    // TODO: other exchange rates
    return '';
  } catch (e) {
    return '';
  }
});

Template.prettyError = function(error) {
  if (typeof error !== "string") {
    error = error.toString();
  }
  return error.split('\n')[0];
}
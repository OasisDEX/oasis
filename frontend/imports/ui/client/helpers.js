import { Session } from 'meteor/session';
import { Blaze } from 'meteor/blaze';
import { Spacebars } from 'meteor/spacebars';
import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { BigNumber } from 'meteor/ethereum:web3';
import { EthTools } from 'meteor/ethereum:tools';
import { Dapple, web3Obj } from 'meteor/makerotc:dapple';
import { moment } from 'meteor/momentjs:moment';

import Tokens from '/imports/api/tokens';
import { Offers, Trades, IndividualTrades, Status } from '/imports/api/offers';

import { txHref, thousandSeparator, formatNumber, fractionSeparator } from '/imports/utils/functions';

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
    contractAddress = Dapple['maker-otc'].environments[Dapple.env].otc.value;
  }
  return contractAddress;
});

Template.registerHelper('contractHref', () => {
  let contractHref = '';
  if (Dapple['maker-otc'].objects) {
    const network = Session.get('network');
    let networkPrefix = '';
    if (network === 'kovan') {
      networkPrefix = 'kovan.';
    }
    const contractAddress = Dapple['maker-otc'].environments[Dapple.env].otc.value;
    contractHref = `https://${networkPrefix}etherscan.io/address/${contractAddress}`;
  }
  return contractHref;
});

Template.registerHelper('txHref', (tx) => txHref(tx));

Template.registerHelper('marketCloseTime', () => Session.get('close_time'));

Template.registerHelper('isMarketOpen', () => Session.get('market_open'));

Template.registerHelper('ready', () =>
    // XXX disabled 'syncing' as parity is being very bouncy
    // Session.get('isConnected') && !Session.get('syncing') && !Session.get('outOfSync')
  Session.get('isConnected') && !Session.get('outOfSync'),
);

Template.registerHelper('isConnected', () => Session.get('isConnected'));

Template.registerHelper('hasAccount', () => Session.get('address'));

Template.registerHelper('outOfSync', () => Session.get('outOfSync'));

Template.registerHelper('syncing', () => Session.get('syncing'));

Template.registerHelper('syncingPercentage', () => {
  const startingBlock = Session.get('startingBlock');
  const currentBlock = Session.get('currentBlock');
  const highestBlock = Session.get('highestBlock');
  return Math.round(100 * ((currentBlock - startingBlock) / (highestBlock - startingBlock)));
});

Template.registerHelper('loading', () => Session.get('loading'));

Template.registerHelper('loadingBuyOrders', () => Session.get('loadingBuyOrders'));

Template.registerHelper('loadingSellOrders', () => Session.get('loadingSellOrders'));

Template.registerHelper('loadingProgress', () => Session.get('loadingProgress'));

Template.registerHelper('loadingCounter', () => Session.get('loadingCounter'));

Template.registerHelper('loadingTransferHistory', () => Session.get('loadingTransferHistory'));

Template.registerHelper('loadingWrapHistory', () => Session.get('loadingWrapHistory'));

Template.registerHelper('loadingTradeHistory', () => Session.get('loadingTradeHistory'));

Template.registerHelper('loadingIndividualTradeHistory', () => Session.get('loadingIndividualTradeHistory'));

Template.registerHelper('loadedCurrencies', () => Session.get('balanceLoaded') === true
&& Session.get('allowanceLoaded') === true && Session.get('limitsLoaded') === true);

Template.registerHelper('loadingTokenEvents', (txHash) => {
  const currentlyLoading = Session.get('loadingTokenEvents');
  return currentlyLoading[txHash];
});

Template.registerHelper('address', () => Session.get('address'));

Template.registerHelper('ETHBalance', () => Session.get('ETHBalance'));

Template.registerHelper('GNTBalance', () => Session.get('GNTBalance'));

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
  options.sort = { timestamp: -1 };
  const obj = {
    $or: [
      { buyWhichToken: quoteCurrency, sellWhichToken: baseCurrency },
      { buyWhichToken: baseCurrency, sellWhichToken: quoteCurrency },
    ],
  };
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
  options.sort = { timestamp: -1 };
  const obj = {
    $or: [
      { buyWhichToken: quoteCurrency, sellWhichToken: baseCurrency },
      { buyWhichToken: baseCurrency, sellWhichToken: quoteCurrency },
    ],
  };
  return Trades.find(obj, options);
});

Template.registerHelper('countOffers', (type) => {
  const quoteCurrency = Session.get('quoteCurrency');
  const baseCurrency = Session.get('baseCurrency');

  if (type === 'ask') {
    return Offers.find({
      buyWhichToken: quoteCurrency,
      sellWhichToken: baseCurrency,
    }).count();
  } else if (type === 'bid') {
    return Offers.find({
      buyWhichToken: baseCurrency,
      sellWhichToken: quoteCurrency,
    }).count();
  }
  return 0;
});

Template.registerHelper('findOffers', (type) => {
  const quoteCurrency = Session.get('quoteCurrency');
  const baseCurrency = Session.get('baseCurrency');
  const limit = Session.get('orderBookLimit');

  const options = {};
  if (limit) {
    options.limit = limit;
  }
  if (type === 'ask') {
    options.sort = { ask_price_sort: 1, _id: 1 };
    return Offers.find({
      buyWhichToken: quoteCurrency,
      sellWhichToken: baseCurrency,
    }, options);
  } else if (type === 'bid') {
    options.sort = { bid_price_sort: -1, _id: 1 };
    return Offers.find({
      buyWhichToken: baseCurrency,
      sellWhichToken: quoteCurrency,
    }, options);
  }
  return [];
});

Template.registerHelper('findOrders', (state) => {
  const address = Session.get('address');

  if (state === Status.OPEN) {
    const quoteCurrency = Session.get('quoteCurrency');
    const baseCurrency = Session.get('baseCurrency');

    const or = [
      { buyWhichToken: quoteCurrency, sellWhichToken: baseCurrency },
      { buyWhichToken: baseCurrency, sellWhichToken: quoteCurrency },
    ];

    Session.set('loadingIndividualTradeHistory', false);

    return Offers.find({ owner: address, $or: or }, { sort: { buyWhichToken: 1, _id: -1 } });
  } else if (state === Status.CLOSED) {
    if (!Session.get('areIndividualTradesSynced')) {
      Session.set('loadingIndividualTradeHistory', true);

      Offers.syncIndividualTrades();
    }

    const baseCurrencyAddress = Dapple.getTokenAddress(Session.get('baseCurrency'));
    const quoteCurrencyAddress = Dapple.getTokenAddress(Session.get('quoteCurrency'));

    return IndividualTrades.find({
      $or: [
        { $and: [{ buyWhichToken_address: baseCurrencyAddress }, { sellWhichToken_address: quoteCurrencyAddress }] },
        { $and: [{ buyWhichToken_address: quoteCurrencyAddress }, { sellWhichToken_address: baseCurrencyAddress }] },
      ],
    }, { sort: { timestamp: -1 } });
  }

  return [];
});

Template.registerHelper('findOffer', (id) => Offers.findOne(id));

Template.registerHelper('selectedOffer', () => Session.get('selectedOffer'));

Template.registerHelper('quoteCurrency', () => Session.get('quoteCurrency'));

Template.registerHelper('baseCurrency', () => Session.get('baseCurrency'));

Template.registerHelper('equals', (a, b) => a === b);

Template.registerHelper('not', (b) => !b);

Template.registerHelper('or', (a, b) => a || b);

Template.registerHelper('and', (a, b) => a && b);

Template.registerHelper('ternary', (logical, yes, no) => (logical ? yes : no));

Template.registerHelper('gt', (a, b) => a > b);

Template.registerHelper('multiply', (a, b) => a * b);

Template.registerHelper('concat', (...args) => Array.prototype.slice.call(args, 0, -1).join(''));

Template.registerHelper('timestampToString', (ts, inSeconds, short) => {
  let timestampStr = '';
  if (ts) {
    const momentFromTimestamp = (inSeconds === true) ? moment.unix(ts) : moment.unix(ts / 1000);
    if (short === true) {
      timestampStr = momentFromTimestamp.format('DD-MM-HH:mm');
    } else {
      timestampStr = momentFromTimestamp.format();
    }
  }
  return timestampStr;
});

Template.registerHelper('formatDateMarketClose', (ts, inSeconds) => {
  let timestampStr = '';
  if (ts) {
    const momentFromTimestamp = (inSeconds === true) ? moment.unix(ts) : moment.unix(ts / 1000);
    timestampStr = momentFromTimestamp.format('DD-MMM-YYYY');
  }
  return timestampStr;
});

Template.registerHelper('log', (value) => {
  console.log(value);
});

Template.registerHelper('fromWei', (s) => web3Obj.fromWei(s));

Template.registerHelper('toWei', (s) => web3Obj.toWei(s));

Template.registerHelper('friendlyAddress', (address) => `${address.substr(0, 9)}...`);

Template.registerHelper('isMyAddress', (address) => address === Session.get('address'));

Template.registerHelper('fromPrecision', (value, precision) => {
  let displayValue = value;
  try {
    if (!(displayValue instanceof BigNumber)) {
      displayValue = new BigNumber(displayValue);
    }
    return displayValue.div(Math.pow(10, precision));
  } catch (e) {
    return new BigNumber(0);
  }
});

Template.registerHelper('validPrecision', (value, precision) => {
  let displayValue = value;
  /* let tokenPrecision = precision;
   if (isNaN(tokenPrecision)) {
   const tokenSpecs = Dapple.getTokenSpecs(precision);
   tokenPrecision = tokenSpecs.precision;
   }*/
  try {
    if (!(displayValue instanceof BigNumber)) {
      displayValue = new BigNumber(displayValue);
    }
    if (displayValue.dp() <= precision) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
});

Template.registerHelper('formatPrice', (value, currency) => {
  let displayValue = value;
  const format = '0,0.00[0000]';
  try {
    if (!(displayValue instanceof BigNumber)) {
      displayValue = new BigNumber(displayValue);
    }

    if (currency === 'W-ETH') {
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

Template.registerHelper('formatBalance', (wei, decimals, currency, sle) => {
  let decimalsValue = decimals;
  if (decimalsValue instanceof Spacebars.kw) {
    decimalsValue = null;
  }
  let showLabelExact = sle;
  if (showLabelExact instanceof Spacebars.kw) {
    showLabelExact = null;
  }
  decimalsValue = decimalsValue || 3;
  let exactValue = web3Obj.fromWei(wei);
  let finalValue = formatNumber(exactValue, decimalsValue);
  exactValue = thousandSeparator(exactValue);

  if (currency === 'W-GNT' || currency === 'GNT' || currency === 'SNGLS') {
    finalValue = finalValue.substr(0, finalValue.indexOf(fractionSeparator()));
  }

  if (showLabelExact) {
    return `<span title=${exactValue}>${finalValue}</span>`;
  }

  return finalValue;
});

Template.registerHelper('formatLimit', (limitReport) => {
  const precision = Dapple.getTokenSpecs(limitReport.token).precision;
  const tokenLimit = new BigNumber(limitReport.limit);
  return tokenLimit.div(new BigNumber(10).pow(precision));
});

Template.registerHelper('formatNumber', (value, decimals, sle) => {
  const precision = Session.get('precision');
  let decimalsValue = decimals;
  if (decimalsValue instanceof Spacebars.kw) {
    decimalsValue = null;
  }
  let showLabelExact = sle;
  if (showLabelExact instanceof Spacebars.kw) {
    showLabelExact = null;
  }
  decimalsValue = decimalsValue || ((precision && precision < 5) ? precision : 5);

  const exactValue = thousandSeparator(value);
  const finalValue = formatNumber(value, decimalsValue);

  if (showLabelExact) {
    return `<span title=${exactValue}>${finalValue}</span>`;
  }

  return finalValue;
});

Template.registerHelper('formatGasLimit', (gasLimit, size, suffix) => {
  const formattedGasLimit = gasLimit / size;
  return `${formattedGasLimit.toPrecision(2)}${suffix}`;
});

Template.registerHelper('determineOrderType', (order, section) => {
  const baseCurrency = Session.get('baseCurrency');
  const address = Session.get('address');
  let type = '';
  if (section === 'lastTrades') {
    if (order.buyWhichToken === baseCurrency) {
      type = 'ask';
    } else if (order.sellWhichToken === baseCurrency) {
      type = 'bid';
    }
  } else if (section === 'myOrders' && order.counterParty) { // this reflects only trades which are closed ( has a counterparty)
    if (address === order.issuer && order.buyWhichToken === baseCurrency) {
      type = 'bid';
    } else if (address === order.issuer && order.sellWhichToken === baseCurrency) {
      type = 'ask';
    } else if (address === order.counterParty && order.sellWhichToken === baseCurrency) {
      type = 'bid';
    } else if (address === order.counterParty && order.buyWhichToken === baseCurrency) {
      type = 'ask';
    }
  } else if (order.buyWhichToken === baseCurrency) {
    type = 'bid';
  } else if (order.sellWhichToken === baseCurrency) {
    type = 'ask';
  }
  return type;
});

Template.registerHelper('loadingIcon', (size) => {
  const image = (size === 'large') ? 'loadingLarge' : 'loading';
  return `<img src="${image}.svg" alt="Loading..." />`;
});

Template.registerHelper('volumeSelector', () => Session.get('volumeSelector'));

Template.registerHelper('isMatchingEnabled', () => Session.get('isMatchingEnabled'));

Template.registerHelper('isBuyEnabled', () => !Session.get('isMatchingEnabled') ||
(Session.get('isBuyEnabled') && Session.get('isMatchingEnabled')));

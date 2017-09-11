import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { BigNumber } from 'meteor/ethereum:web3';
import { Dapple, web3Obj } from 'meteor/makerotc:dapple';
import { Spacebars } from 'meteor/spacebars';

/**
 * Best case scenario:
 *  - a valid contract address is passed and we have corresponding token symbol
 *  then we return the symbol for the token.
 *
 *  If the token is a valid address but not known to the market, default value will be returned
 *  If the token is not known, default value is returned
 *
 * @param addressOrToken - of type <any>
 * @param defaultToken - of type <string> - used as value if token is invalid value
 *  (not an address, not an address known to the market, not a symbol, not a symbol known to market. (mandatory)
 *
 * @return string
 *
 * @throws error if the method is invoked with missing attributes or the types of the attributes are different than expected
 */
function asToken(addressOrToken, defaultToken) {
  const allTokens = Dapple.getTokens();

  if (!defaultToken
    || typeof defaultToken !== 'string'
    || !allTokens.includes(defaultToken)) {
    throw Error('Wrong usage of the API. Read documentation');
  }

  if (!addressOrToken || typeof addressOrToken !== 'string') {
    return defaultToken;
  }
  const isAnAddress = web3Obj.isAddress(addressOrToken);
  let currency = defaultToken.toUpperCase();
  let token = addressOrToken.toUpperCase();

  if (isAnAddress) {
    token = Dapple.getTokenByAddress(addressOrToken).toUpperCase();
  }

  if (token && allTokens.includes(token)) {
    currency = token;
  }

  return currency;
}

export function uppercaseFirstLetter(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// This is needed for Metamask errors
// See: https://github.com/MetaMask/metamask-plugin/issues/672
export function formatError(error) {
  return error.toString().split('\n')[0];
}

export function doTabShow() {
  if (location.hash.indexOf('#wrap') !== -1) {
    $('.nav-tabs a[href=#wrap]').tab('show');
  } else if (location.hash.indexOf('#transfer') !== -1) {
    $('.nav-tabs a[href=#transfer]').tab('show');
  } else {
    $('.nav-tabs a[href=#trade]').tab('show');
  }
}

export function doHashChange() {
  // For now is the only currency on the left side
  localStorage.setItem('quoteCurrency', 'W-ETH');

  let quoteCurrency = null;
  let baseCurrency = null;

  if (location.hash.indexOf('#wrap') === -1 && location.hash.indexOf('#transfer') === -1) {
    if (location.hash.indexOf('#trade') === -1) {
      location.hash = `#trade/${localStorage.getItem('baseCurrency') || 'MKR'}`
        + `/${localStorage.getItem('quoteCurrency') || 'W-ETH'}`;
    }
    const coins = location.hash.replace(/#trade\//g, '').split('/');

    /**
     * The default values for base and quote are respectively:
     * MKR and W-ETH in all scenarios. The reason for this is
     * because those are the main currencies that MAKER is dealing with.
     */
    const base = coins[0];
    baseCurrency = asToken(base, 'MKR');

    const quote = coins[1];
    quoteCurrency = asToken(quote, 'W-ETH');

    if (baseCurrency === quoteCurrency) {
      quoteCurrency = 'W-ETH';
      baseCurrency = 'MKR';
    }

    // Looking for any existing pair that contains the currencies provided in the URL
    const pair = Dapple.generatePairs().find((currentPair) =>
    (currentPair.base === baseCurrency && currentPair.quote === quoteCurrency)
    || (currentPair.base === quoteCurrency && currentPair.quote === baseCurrency));

    // if such pair exists we use it to set the base and quote otherwise we default
    if (pair) {
      baseCurrency = pair.base;
      quoteCurrency = pair.quote;
    } else {
      quoteCurrency = 'W-ETH';
      baseCurrency = 'MKR';
    }

    Session.set('newPairSelected', pair);

    location.hash = `#trade/${baseCurrency}/${quoteCurrency}`;
  }

  doTabShow();

  Session.set('quoteCurrency', quoteCurrency || localStorage.getItem('quoteCurrency'));
  Session.set('baseCurrency', baseCurrency || localStorage.getItem('baseCurrency'));
}

export function txHref(tx) {
  let txLink = '';
  if (Dapple['maker-otc'].objects) {
    const network = Session.get('network');
    let networkPrefix = '';
    if (network === 'kovan') {
      networkPrefix = 'kovan.';
    }
    txLink = `https://${networkPrefix}etherscan.io/tx/${tx}`;
  }
  return txLink;
}

export function fractionSeparator() {
  const formatter = new Intl.NumberFormat(navigator.language);

  // Usage of this line is define the separator of fractions based on users locale
  return formatter.format(0.123).charAt(1);
}

export function thousandSeparator(number) {
  const parts = number.toString().split('.');
  const formatter = new Intl.NumberFormat(navigator.language);

  const whole = formatter.format(parts[0]);
  const fraction = (parts[1] ? `${fractionSeparator()}${parts[1]}` : '');

  return whole + fraction;
}

export function formatNumber(number, dec) {
  let decimals = dec;
  if (decimals instanceof Spacebars.kw) {
    decimals = 5;
  }
  let n = number;
  if (typeof number !== 'object') {
    n = new BigNumber(`${number}`);
  }
  const d = (new BigNumber(10)).pow(decimals);
  n = n.mul(d).trunc().div(d).toFixed(decimals, 6);
  return thousandSeparator(n);
}

export function removeOutliersFromArray(data, fieldName, deviation) {
  const l = data.length;
  if (data.length <= 2) {
    return data;
  }
  let sum = 0;     // stores sum of elements
  let sumsq = 0; // stores sum of squares
  for (let i = 0; i < l; ++i) {
    sum += data[i][fieldName];
    sumsq += data[i][fieldName] * data[i][fieldName];
  }
  const mean = sum / l;
  const varience = (sumsq / l) - (mean * mean);
  const sd = Math.sqrt(varience);
  const newData = []; // uses for data which is 3 standard deviations from the mean
  for (let i = 0; i < l; ++i) {
    if (data[i][fieldName] > mean - (deviation * sd) && data[i][fieldName] < mean + (deviation * sd)) {
      newData.push(data[i]);
    }
  }
  return newData;
}

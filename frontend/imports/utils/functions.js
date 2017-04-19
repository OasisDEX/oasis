import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { BigNumber } from 'meteor/ethereum:web3';
import { Dapple, web3 } from 'meteor/makerotc:dapple';
import { Spacebars } from 'meteor/spacebars';

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
      location.hash = `#trade/${localStorage.getItem('quoteCurrency') || 'W-ETH'}`
        + `/${localStorage.getItem('baseCurrency') || 'MKR'}`
    }
    const coins = location.hash.replace('#trade/', '').split('/')

    const quote = coins[0]
    quoteCurrency = _addressToSymbol(quote, Dapple.getQuoteTokens(), 'W-ETH')

    const base = coins[1]
    baseCurrency = _addressToSymbol(base, Dapple.getBaseTokens(), 'MKR')

    if(quote === base){
      quoteCurrency = "W-ETH";
      baseCurrency = "MKR";
    }
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
    if (network === 'ropsten') {
      networkPrefix = 'testnet.';
    } else if (network === 'kovan') {
      networkPrefix = 'kovan.';
    }
    txLink = `https://${networkPrefix}etherscan.io/tx/${tx}`;
  }
  return txLink;
}

export function thousandSeparator(number) {
  const parts = number.toString().split('.');
  return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (parts[1] ? `.${parts[1]}` : '');
}

export function formatNumber(number, dec) {
  let decimals = dec;
  if (decimals instanceof Spacebars.kw) {
    decimals = 5;
  }
  let n = number;
  if (typeof number !== 'object') {
    n = new BigNumber(number);
  }
  const d = (new BigNumber(10)).pow(decimals);
  n = n.mul(d).trunc().div(d).toFixed(decimals);
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

/**
 * Best case scenario:
 *  - a valid contract address is passed and we have corresponding token symbol
 *  then we return the symbol for the token.
 *
 *  If the token is a valid address by not known to the market, default value will be returned
 *  If the token is a symbol already but know among allowedTokens ,default value will be returned
 *  If the token is not known, default value is returned
 *
 * @param token - of type <any>
 * @param allowedTokens - of type <array> - market supports only specific tokens which can be used as base or quote tokens.
 * @param symbolIfNothingIsPresented - of type <string> - used as value if token is invalid value
 *  (not an address, not an address known to the market, not a symbol, not a symbol known to market.
 *
 * @return symbol
 * 
 * @throws error if the method is invoked with missing attributes or the types of the attributes are different than expected
 */
function _addressToSymbol (token, allowedTokens, symbolIfNothingIsPresented) {
  if(!token || !allowedTokens || !symbolIfNothingIsPresented
    || !Array.isArray(allowedTokens)
    || typeof  symbolIfNothingIsPresented !== "string")  {

    throw Error("Wrong usage of the API. Read documentation");
  }

  let isAnAddress = web3.isAddress(token)
  let currency = symbolIfNothingIsPresented

  if (isAnAddress) {
    currency = Dapple.getTokenByAddress(token).toUpperCase()
  }

  if (allowedTokens.includes(token)) {
    currency = token.toUpperCase()
  }

  return currency
}

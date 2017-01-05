import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import Tokens from '/imports/api/tokens';
import { Trades } from '/imports/api/offers';

import './markets.html';

Template.markets.viewmodel({
  autorun() {
    this.quoteCurrency(Session.get('quoteCurrency'));
    this.baseCurrency(Session.get('baseCurrency'));
  },
  quoteCurrencies: Dapple.getQuoteTokens(),
  baseCurrencies: Dapple.getBaseTokens(),
  showDropdownQuoteCurrencies() {
    return this.quoteCurrencies().length > 1;
  },
  showDropdownBaseCurrencies() {
    return this.baseCurrencies().length > 1;
  },
  quoteCurrency: '',
  baseCurrency: '',
  quoteHelper: '',
  baseHelper: '',
  loadingTradeHistory() {
    return Session.get('loadingTradeHistory');
  },
  price(token) {
    const trade = Trades.findOne(
      { $or: [
        { buyWhichToken: token, sellWhichToken: this.quoteCurrency() },
        { buyWhichToken: this.quoteCurrency(), sellWhichToken: token },
      ] },
      { sort: { timestamp: -1 } }
    );

    if (typeof trade === 'undefined') {
      return 'N/A';
    }

    if (trade.buyWhichToken === this.quoteCurrency()) {
      return new BigNumber(trade.buyHowMuch).div(new BigNumber(trade.sellHowMuch)).toNumber();
    }
    return new BigNumber(trade.sellHowMuch).div(new BigNumber(trade.buyHowMuch)).toNumber();
  },
  volume(token) {
    let vol = new BigNumber(0);

    const trades = Trades.find({ $or: [
      { buyWhichToken: token, sellWhichToken: this.quoteCurrency() },
      { buyWhichToken: this.quoteCurrency(), sellWhichToken: token },
    ],
      timestamp: { $gte: (Date.now() / 1000) - (60 * 60 * 24) },
    });

    trades.forEach((trade) => {
      if (trade.buyWhichToken === this.quoteCurrency()) {
        vol = vol.add(new BigNumber(trade.sellHowMuch));
      } else {
        vol = vol.add(new BigNumber(trade.buyHowMuch));
      }
    });

    return vol.toNumber();
  },
  selected(token) {
    return token === this.baseCurrency() ? 'selected' : '';
  },
  quoteChange() {
    // XXX EIP20
    Dapple.getToken(this.quoteCurrency(), (error, token) => {
      if (!error) {
        token.totalSupply((callError) => {
          if (!callError) {
            this.quoteHelper('');
            localStorage.setItem('quoteCurrency', this.quoteCurrency());
            Session.set('quoteCurrency', this.quoteCurrency());
            if (this.baseCurrency() === this.quoteCurrency()) {
              this.baseHelper('Tokens are the same');
            }
            if (location.hash.indexOf('#trade') !== -1) {
              location.hash = `#trade/${this.quoteCurrency()}/${this.baseCurrency()}`;
            }
            Tokens.sync();
          } else {
            this.quoteHelper('Token not found');
          }
        });
      } else {
        this.quoteHelper('Token not found');
      }
    });
  },
  baseChange(newBaseCurrency) {
    this.baseCurrency(newBaseCurrency);
    // XXX EIP20
    Dapple.getToken(this.baseCurrency(), (error, token) => {
      if (!error) {
        token.totalSupply((callError) => {
          if (!callError) {
            this.baseHelper('');
            localStorage.setItem('baseCurrency', this.baseCurrency());
            Session.set('baseCurrency', this.baseCurrency());
            if (this.baseCurrency() === this.quoteCurrency()) {
              this.baseHelper('Tokens are the same');
            }
            if (location.hash.indexOf('#trade') !== -1) {
              location.hash = `#trade/${this.quoteCurrency()}/${this.baseCurrency()}`;
            }
            Tokens.sync();
          } else {
            this.baseHelper('Token not found');
          }
        });
      } else {
        this.baseHelper('Token not found');
      }
    });
  },
});

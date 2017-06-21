import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { BigNumber } from 'meteor/ethereum:web3';

import Tokens from '/imports/api/tokens';
import { Offers, Trades } from '/imports/api/offers';
import { $ } from 'meteor/jquery';

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
      return new BigNumber(trade.buyHowMuch).div(new BigNumber(trade.sellHowMuch));
    }

    return new BigNumber(trade.sellHowMuch).div(new BigNumber(trade.buyHowMuch));
  },
  volume(token) {
    const volumeCurrency = Session.get(`${Session.get('volumeSelector')}Currency`);
    let vol = new BigNumber(0);

    const trades = Trades.find({ $or: [
      { buyWhichToken: token, sellWhichToken: this.quoteCurrency() },
      { buyWhichToken: this.quoteCurrency(), sellWhichToken: token },
    ],
      timestamp: { $gte: (Date.now() / 1000) - (60 * 60 * 24) },
    });

    trades.forEach((trade) => {
      if (trade.buyWhichToken === volumeCurrency) {
        vol = vol.add(new BigNumber(trade.buyHowMuch));
      } else {
        vol = vol.add(new BigNumber(trade.sellHowMuch));
      }
    });
    Session.set('lastVolumeUpdated', Date.now());
    return vol;
  },
  changeVolumeToken(event) {
    event.preventDefault();

    const value = Session.get('volumeSelector') === 'quote' ? 'base' : 'quote';
    Session.set('volumeSelector', value);
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
            if (Session.get('isMatchingEnabled')) {
              Offers.sync();
            }
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
            if (Session.get('isMatchingEnabled')) {
              Offers.sync();
            }
          } else {
            this.baseHelper('Token not found');
          }
        });
      } else {
        this.baseHelper('Token not found');
      }
    });
  },
  sort() {
    if (Session.get('lastVolumeUpdated')) {
      const rows = $('.t-markets tbody  tr').get();
      rows.sort((a, b) => {
        const A = parseFloat($(a).children('td').eq(3).text()
              .replace(/,/g, ''));
        const B = parseFloat($(b).children('td').eq(3).text()
              .replace(/,/g, ''));
        if (A < B) {
          return 1;
        }
        if (A > B) {
          return -1;
        }
        return 0;
      });

      $.each(rows, (index, row) => {
        $('.t-markets').children('tbody').append(row);
      });
    }
  },
});

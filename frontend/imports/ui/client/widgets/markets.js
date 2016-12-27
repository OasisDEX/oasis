import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import Tokens from '/imports/api/tokens';

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

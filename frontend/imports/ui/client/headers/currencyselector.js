import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import Tokens from '/imports/api/tokens';

import './currencyselector.html';

Template.currencySelector.viewmodel({
  autorun() {
    this.quoteCurrency(Session.get('quoteCurrency'));
    this.baseCurrency(Session.get('baseCurrency'));
  },
  currencies: Dapple.getTokens(),
  quoteCurrency: '',
  baseCurrency: '',
  quoteHelper: '',
  baseHelper: '',
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
            location.hash = '#trade-' + this.quoteCurrency() + '-' + this.baseCurrency();
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
  baseChange() {
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
            location.hash = '#trade-' + this.quoteCurrency() + '-' + this.baseCurrency();
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

Template.currencySelector.events({
  'click #spnSwitchCurrencies': function switchCurrencies() {
    const quoteCurrency = Session.get('quoteCurrency');
    const baseCurrency = Session.get('baseCurrency');
    Session.set('quoteCurrency', baseCurrency);
    Session.set('baseCurrency', quoteCurrency);
  },
});

import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { BigNumber } from 'meteor/ethereum:web3';

import { web3Obj } from 'meteor/makerotc:dapple';

import Tokens from '/imports/api/tokens';
import { Offers, Trades } from '/imports/api/offers';
import { $ } from 'meteor/jquery';

import './markets.html';

Template.markets.helpers({});

Template.markets.viewmodel({
  autorun() {
    this.quoteCurrency(Session.get('quoteCurrency'));
    this.baseCurrency(Session.get('baseCurrency'));
    const pairs = Dapple.generatePairs();

    pairs.forEach((givenPair) => {
      const pair = givenPair;
      pair.volume = this.volume(givenPair);
      pair.price = this.price(givenPair);
      pair.isVisible = () => pair.volume.gt(new BigNumber(0)) || pair.priority > 0;
    });
    this.tradingPairs(this.sortByPriorityAndThenByVolume(pairs));
  },
  quoteCurrencies: Dapple.getQuoteTokens(),
  baseCurrencies: Dapple.getBaseTokens(),
  tradingPairs: [],
  showDropdownQuoteCurrencies() {
    return this.quoteCurrencies().length > 1;
  },
  showDropdownBaseCurrencies() {
    return this.baseCurrencies().length > 1;
  },
  showMore() {
    this.showAll(true);
  },
  showLess() {
    this.showAll(false);
  },
  quoteCurrency: '',
  baseCurrency: '',
  quoteHelper: '',
  baseHelper: '',
  showAll: false,
  price(pair) {
    const trade = Trades.findOne(
      {
        $or: [
          { buyWhichToken: pair.base, sellWhichToken: pair.quote },
          { buyWhichToken: pair.quote, sellWhichToken: pair.base },
        ],
      },
      { sort: { timestamp: -1 } },
    );

    if (typeof trade === 'undefined') {
      return 'N/A';
    }

    if (trade.buyWhichToken === pair.quote) {
      return new BigNumber(trade.buyHowMuch).div(new BigNumber(trade.sellHowMuch));
    }

    return new BigNumber(trade.sellHowMuch).div(new BigNumber(trade.buyHowMuch));
  },
  volume(pair) {
    // const volumeCurrency = Session.get(`${Session.get('volumeSelector')}Currency`);
    let vol = new BigNumber(0);

    /**
     * Since the records in the Trades collection are within a week period,
     * there is no need to sort them by timestamp.
     *
     * If shorter period of time is required please add the following criteria after `or`
     * `timestamp: { $gte: (Date.now() / 1000) - (60 * 60 * 24 ) }` - i.e. for a day
     */
    const trades = Trades.find({
      $or: [
        { buyWhichToken: pair.base, sellWhichToken: pair.quote },
        { buyWhichToken: pair.quote, sellWhichToken: pair.base },
      ],
    });

    trades.forEach((trade) => {
      if (trade.buyWhichToken === pair.quote) {
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
    return token.base === this.baseCurrency() && token.quote === this.quoteCurrency() ? 'selected' : '';
  },
  select(pair) {
    this.quoteCurrency(pair.quote);
    localStorage.setItem('quoteCurrency', this.quoteCurrency());
    Session.set('quoteCurrency', this.quoteCurrency());
    this.baseCurrency(pair.base);
    localStorage.setItem('baseCurrency', this.baseCurrency());
    Session.set('baseCurrency', this.baseCurrency());

    if (location.hash.indexOf('#trade') !== -1) {
      location.hash = `#trade/${this.baseCurrency()}/${this.quoteCurrency()}`;
    }
    Tokens.sync();
    if (Session.get('isMatchingEnabled')) {
      Offers.sync();
    }
  },
  // not used in current impl - investigate to remove
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
              location.hash = `#trade/${this.baseCurrency()}/${this.quoteCurrency()}`;
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
  // not used in current impl - investigate to remove
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
              location.hash = `#trade/${this.baseCurrency()}/${this.quoteCurrency()}`;
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
  sortByPriorityAndThenByVolume(pairs) {
    return pairs.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      if (a.volume !== b.volume) return b.volume - a.volume;
      return 0;
    });
  },
  showScroll() {
    return this.tradingPairs().filter((pair) => pair.isVisible()).length > 5 || this.showAll();
  },
  pairContains(token) {
    return this.quoteCurrency().toUpperCase() === token.toUpperCase()
       || this.baseCurrency().toUpperCase() === token.toUpperCase();
  },
});

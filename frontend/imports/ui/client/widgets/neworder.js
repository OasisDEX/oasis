import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { BigNumber } from 'meteor/ethereum:web3';
import { web3 } from 'meteor/makerotc:dapple';

import Tokens from '/imports/api/tokens';
import { Offers } from '/imports/api/offers';
import { $ } from 'meteor/jquery';

import '/imports/ui/client/shared.js';
import './neworder.html';


Template.neworder.viewmodel({
  share: 'newOffer',
  lastError: '',
  bestOffer: undefined,
  type() {
    const orderType = (this !== null && this !== undefined) ? this.orderType() : '';
    return orderType;
  },
  sellCurrency() {
    if (this.type() === 'buy') {
      return Session.get('quoteCurrency');
    }
    return Session.get('baseCurrency');
  },
  price: '0',
  priceDefined() {
    try {
      const price = new BigNumber(this.price());
      return !price.isNaN() && price.gt(0);
    } catch (e) {
      return false;
    }
  },
  amount: '0',
  calcTotal() {
    try {
      const price = new BigNumber(this.price());
      const amount = new BigNumber(this.amount());
      const total = price.times(amount);
      if (total.isNaN()) {
        this.total('0');
      } else {
        this.total(total.toString(10));
      }
    } catch (e) {
      this.total('0');
    }
  },
  total: '0',
  calcAmount() {
    try {
      const price = new BigNumber(this.price());
      let amount = new BigNumber(this.amount());
      const total = new BigNumber(this.total());
      if (total.isZero() && price.isZero() && (amount.isNaN() || amount.isNegative())) {
        this.amount('0');
      } else if (!total.isZero() || !price.isZero()) {
        amount = total.div(price);
        if (amount.isNaN()) {
          this.amount('0');
        } else {
          this.amount(amount.toString(10));
        }
      }
    } catch (e) {
      this.amount('0');
    }
  },
  maxAmount() {
    let maxAmount = '0';
    if (this.type() === 'sell') {
      const token = Tokens.findOne(Session.get('baseCurrency'));
      if (token) {
        const balance = new BigNumber(token.balance);
        const allowance = new BigNumber(token.allowance);
        maxAmount = web3.fromWei(BigNumber.min(balance, allowance).toString(10));
      }
    } else {
      maxAmount = '9e999';
    }
    return maxAmount;
  },
  maxTotal() {
    // Only allow change of total if price is well-defined
    try {
      const price = new BigNumber(this.price());
      if ((price.isNaN() || price.isZero() || price.isNegative())) {
        return '0';
      }
    } catch (e) {
      return '0';
    }
    // If price is well-defined, take minimum of balance and allowance of currency, if 'buy', otherwise Infinity
    let maxTotal = '0';
    if (this.type() === 'buy') {
      const token = Tokens.findOne(Session.get('quoteCurrency'));
      if (token) {
        const balance = new BigNumber(token.balance);
        const allowance = new BigNumber(token.allowance);
        maxTotal = web3.fromWei(BigNumber.min(balance, allowance).toString(10));
      }
    } else {
      maxTotal = '9e999';
    }
    return maxTotal;
  },
  hasBalance(currency) {
    try {
      const token = Tokens.findOne(currency);
      const balance = new BigNumber(token.balance);
      return token && balance.gte(web3.toWei(new BigNumber(this.type() === 'sell' ? this.amount() : this.total())));
    } catch (e) {
      return false;
    }
  },
  hasAllowance(currency) {
    try {
      const token = Tokens.findOne(currency);
      const allowance = new BigNumber(token.allowance);
      return token && allowance.gte(web3.toWei(new BigNumber(this.type() === 'sell' ? this.amount() : this.total())));
    } catch (e) {
      return false;
    }
  },
  canSubmit() {
    try {
      const type = this.type();
      const price = new BigNumber(this.price());
      const amount = new BigNumber(this.amount());
      const maxAmount = new BigNumber(this.maxAmount());
      const total = new BigNumber(this.total());
      const maxTotal = new BigNumber(this.maxTotal());
      const marketOpen = Session.get('market_open');
      const validTokenPair = Session.get('quoteCurrency') !== Session.get('baseCurrency');
      return marketOpen && price.gt(0) && amount.gt(0) && total.gt(0) && validTokenPair &&
        (type !== 'buy' || total.lte(maxTotal)) && (type !== 'sell' || amount.lte(maxAmount));
    } catch (e) {
      return false;
    }
  },
  preventDefault(event) {
    event.preventDefault();
  },
  betterOffer() {
    try {
      const quoteCurrency = Session.get('quoteCurrency');
      const baseCurrency = Session.get('baseCurrency');
      const price = new BigNumber(this.price());
      if (price.lte(0) || price.isNaN()) {
        this.bestOffer(undefined);
        return undefined;
      }

      let offer;
      if (this.type() === 'buy') {
        offer = Offers.findOne({ buyWhichToken: quoteCurrency, sellWhichToken: baseCurrency },
                               { sort: { ask_price: 1 } });
        if (offer && Object.prototype.hasOwnProperty.call(offer, 'ask_price')
            && price.gt(new BigNumber(offer.ask_price.toString()))) {
          this.bestOffer(offer._id);
          return offer;
        }
        this.bestOffer(undefined);
        return undefined;
      } else if (this.type() === 'sell') {
        offer = Offers.findOne({ buyWhichToken: baseCurrency, sellWhichToken: quoteCurrency },
                               { sort: { ask_price: 1 } });
        if (offer && Object.prototype.hasOwnProperty.call(offer, 'bid_price')
            && price.lt(new BigNumber(offer.bid_price.toString()))) {
          this.bestOffer(offer._id);
          return offer;
        }
      }
    } catch (e) {
      this.bestOffer(undefined);
      return undefined;
    }
    this.bestOffer(undefined);
    return undefined;
  },
  openOfferModal() {
    Session.set('selectedOffer', this.bestOffer());
  },
  showConfirmation(event) {
    event.preventDefault();
    this.offerPrice(this.price());
    this.offerAmount(this.amount());
    this.offerTotal(this.total());
    this.offerType(this.type());
  },
  showDepositTab() {
    $('#deposit').tab('show');
  },
  showAllowanceModal() {
    $('#allowanceModal').modal('show');
  },
});

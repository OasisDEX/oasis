import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { BigNumber } from 'meteor/ethereum:web3';
import { web3Obj } from 'meteor/makerotc:dapple';
import Tokens from '/imports/api/tokens';
import { Offers } from '/imports/api/offers';
import { $ } from 'meteor/jquery';

import '/imports/ui/client/shared.js';
import './neworder.html';

Template.neworder.viewmodel({
  share: 'newOffer',
  lastError: '',
  bestOffer: undefined,
  validAmount: true,
  total: '',
  price: '',
  amount: '',
  shouldShowMaxBtn: false,
  events: {
    'input input, click .dex-btn-max': function () {
      const order = Session.get('selectedOrder');
      if (order) {
        Session.set('selectedOrder', '');
      }
    },
    'keyup input[data-requires-precision]'(event) {
      const precision = Session.get('precision');
      const value = event.target.value;
      try {
        const amount = new BigNumber(value || 0);
        if (amount.decimalPlaces() > precision) {
          $(event.target).val(amount.toFixed(precision), 6);
          $(event.target).trigger('change');
        }
      } catch (exception) {
        console.debug('Provided value in the input field is not a number!', exception);
      }
    },
  },
  autorun() {
    const order = Session.get('selectedOrder');
    if (order) {
      /*
       * If we have an existing offer with the given characteristics
       *  PRICE: 2.00000
       *  AMOUNT: 2.00000
       *  TOTAL: 2.0000
       *
       *  Click on the existing order and the neworder input fields
       *  will be populated with the same values.
       *
       *  Proceed and create new order with given values.
       *
       *  Don't click anywhere else and wait for the new order to appear in orderbook.
       *
       *  Click on it or on the previous order that we created the first order from.
       *  The input fields will be all 0's thought the values of the properties will be popualted.
       *
       *  Assuming this is some rendering issue (most likely from meteor) this is the solution.
       *  Before applying the new values, we clear old ones, forcing everything to rerender.
       * */
      this.amount('');
      this.price('');
      this.total('');
      this.offerAmount(0);
      this.offerPrice(0);
      this.offerTotal(0);

      const actionType = order.type === 'bid' ? 'buy' : 'sell';
      const orderData = Offers.findOne({ _id: order.id });
      if (orderData) {
        this.price(orderData[`${order.type}_price`]);

        if (actionType === this.type()) {
          this.amount(web3Obj.fromWei(orderData[`${actionType}HowMuch`]));
        } else {
          this.amount(0);
        }

        this.calcTotal();
      }
    }
  },
  type() {
    return this.orderType() ? this.orderType() : '';
  },
  precision() {
    return Session.get('precision');
  },
  sellCurrency() {
    if (this.type() === 'buy') {
      return Session.get('quoteCurrency');
    }
    return Session.get('baseCurrency');
  },
  onFocus() {
    this.shouldShowMaxBtn(true);
  },
  onBlur() {
    this.shouldShowMaxBtn(false);
  },
  focusOnInput(event) {
    $(event.target).find('input.with-max-btn').focus();
  },
  canAutofill() {
    return Session.get('market_open');
  },
  canChangePrice() {
    return Session.get('market_open');
  },
  canChangeAmountAndTotal() {
    const marketOpen = Session.get('market_open');
    if (!marketOpen) return false;
    try {
      const price = new BigNumber(this.price());
      return !price.isNaN() && price.gt(0);
    } catch (e) {
      return false;
    }
  },
  calcTotal() {
    this.validAmount(true);
    if (this.precision() === 0 && this.amount() % 1 !== 0) {
      this.validAmount(false);
      this.total('0');
      return;
    }
    try {
      const price = new BigNumber(new BigNumber(this.price(), 10).toFixed(this.precision(), 6));
      const amount = new BigNumber(new BigNumber(this.amount(), 10).toFixed(this.precision(), 6));
      const total = new BigNumber(price.times(amount).toFixed(this.precision(), 6), 10);
      if (total.isNaN()) {
        this.total('0');
      } else {
        this.total(total.toString(10));
      }
    } catch (e) {
      this.total('0');
    }
  },
  calcAmount() {
    this.validAmount(true);
    if (this.precision() === 0 && this.total() % 1 !== 0) {
      this.validAmount(false);
      this.amount('0');
      return;
    }
    try {
      const price = new BigNumber(new BigNumber(this.price(), 10).toFixed(this.precision(), 6));
      const total = new BigNumber(new BigNumber(this.total(), 10).toFixed(this.precision(), 6));
      if (total.isZero() && price.isZero()) {
        this.amount('0');
      } else {
        const amount = new BigNumber(total.div(price).toFixed(this.precision(), 6), 10);
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
        /* const allowance = new BigNumber(token.allowance);
         maxAmount = web3Obj.fromWei(BigNumber.min(balance, allowance).toString(10));*/
        maxAmount = web3Obj.fromWei(balance.toString(10));
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
        /* const allowance = new BigNumber(token.allowance);
         maxTotal = web3Obj.fromWei(BigNumber.min(balance, allowance).toString(10));*/
        maxTotal = web3Obj.fromWei(balance.toString(10));
      }
    } else {
      maxTotal = '9e999';
    }
    return maxTotal;
  },
  hasBalance(currency) {
    const token = Tokens.findOne(currency);
    let balance = new BigNumber(0);
    try {
      balance = new BigNumber(token.balance);
      const hasPositiveBalance = balance.gt(0) && balance.gte(web3Obj.toWei(new BigNumber(this.type() === 'sell' ? this.amount() : this.total())));
      const hasZeroBalanceWithNothingAsPrice = balance.equals(0) && !this.price();
      return hasPositiveBalance || hasZeroBalanceWithNothingAsPrice;
    } catch (e) {
      /**
       * This error will happen if we try to create BigNumber from non-number value.
       *
       * We would like to consider the user has balance if he enteres value in the price field
       * because we can allow him just use the form for calculation.
       */
      return (balance.equals(0) && !this.price()) || (balance.gt(0) && !this.price());
    }
  },
  quoteAvailable() {
    const token = Tokens.findOne(Session.get('quoteCurrency'));
    if (token) {
      return token.balance;
    }
    return 0;
  },
  baseAvailable() {
    const token = Tokens.findOne(Session.get('baseCurrency'));
    if (token) {
      return token.balance;
    }
    return 0;
  },
  quoteAllowance() {
    const token = Tokens.findOne(Session.get('quoteCurrency'));
    if (token) {
      return token.allowance;
    }
    return 0;
  },
  baseAllowance() {
    const token = Tokens.findOne(Session.get('baseCurrency'));
    if (token) {
      return token.allowance;
    }
    return 0;
  },
  hasAllowance(currency) {
    try {
      const token = Tokens.findOne(currency);
      const allowance = new BigNumber(token.allowance);
      return token && allowance.gte(web3Obj.toWei(new BigNumber(this.type() === 'sell' ? this.amount() : this.total())));
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
          { sort: { ask_price_sort: 1 } });
        if (offer && Object.prototype.hasOwnProperty.call(offer, 'ask_price')
          && price.gt(new BigNumber(offer.ask_price))) {
          this.bestOffer(offer._id);
          return offer;
        }
        this.bestOffer(undefined);
        return undefined;
      } else if (this.type() === 'sell') {
        offer = Offers.findOne({ buyWhichToken: baseCurrency, sellWhichToken: quoteCurrency },
          { sort: { ask_price_sort: 1 } });
        if (offer && Object.prototype.hasOwnProperty.call(offer, 'bid_price')
          && price.lt(new BigNumber(offer.bid_price))) {
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
  autofill(event) {
    event.preventDefault();
    const marketOpen = Session.get('market_open');
    let available = 0;
    if (!marketOpen) return false;
    if (this.type() === 'buy') {
      available = web3Obj.fromWei(this.quoteAvailable()).toString(10);
      this.total(available);
      this.calcAmount();
    } else if (this.type() === 'sell') {
      available = web3Obj.fromWei(this.baseAvailable()).toString(10);
      this.amount(available);
      this.calcTotal();
    }
    return false;
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
  showAllowanceModal(token) {
    $(`#allowanceModal${token}`).modal('show');
  },
});

import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { BigNumber } from 'meteor/ethereum:web3';
import { web3 } from 'meteor/makerotc:dapple';
import { formatError } from '/imports/utils/functions';

import Tokens from '/imports/api/tokens';
import { Offers, Status } from '/imports/api/offers';

import './offermodal.html';

// TODO: DELETE THIS, TESTING PURPOSE
window.Tokens = Tokens;

const latest = require('promise-latest');

Template.offermodal.viewmodel({
  share: 'newOffer',
  gasEstimateInProgress: false,
  gasEstimateResult: null,
  gasEstimateError: null,
  autorun() {
    this.estimateGasUsage();
  },
  precision() {
    return Dapple.getTokenSpecs(Session.get('baseCurrency')).precision;
  },
  validNewOrderAmount: true,
  quoteToken() {
    return Tokens.findOne(Session.get('quoteCurrency'));
  },
  baseToken() {
    return Tokens.findOne(Session.get('baseCurrency'));
  },
  hasAllowanceNewOrder() {
    try {
      const token = Tokens.findOne(this.offerType() === 'buy'
                                                      ? Session.get('quoteCurrency') : Session.get('baseCurrency'));
      const allowance = new BigNumber(token.allowance);

      return token && allowance.gte(web3.toWei(new BigNumber(this.offerType() === 'buy'
                                                                       ? this.offerTotal() : this.offerAmount())));
    } catch (e) {
      return false;
    }
  },
  calcNewOfferTotal() {
    this.validNewOrderAmount(true);
    if (this.precision() === 0 && this.offerAmount() % 1 !== 0) {
      this.validNewOrderAmount(false);
      this.offerTotal('0');
      this.estimateGasUsage();
      return;
    }
    try {
      const price = new BigNumber(this.offerPrice());
      const amount = new BigNumber(this.offerAmount());
      const total = price.times(amount);
      if (total.isNaN()) {
        this.offerTotal('0');
      } else {
        this.offerTotal(total.toString(10));
      }
    } catch (e) {
      this.offerTotal('0');
    }
    this.estimateGasUsage();
  },
  calcNewOfferAmount() {
    this.validNewOrderAmount(true);
    if (this.precision() === 0 && this.offerTotal() % 1 !== 0) {
      this.validNewOrderAmount(false);
      this.offerAmount('0');
      this.estimateGasUsage();
      return;
    }
    try {
      const price = new BigNumber(this.offerPrice());
      let amount = new BigNumber(this.offerAmount());
      const total = new BigNumber(this.offerTotal());
      if (total.isZero() && price.isZero() && (amount.isNaN() || amount.isNegative())) {
        this.offerAmount('0');
      } else if (!total.isZero() || !price.isZero()) {
        amount = total.div(price);
        if (amount.isNaN()) {
          this.offerAmount('0');
        } else {
          this.offerAmount(amount.toString(10));
        }
      }
    } catch (e) {
      this.offerAmount('0');
    }
    this.estimateGasUsage();
  },
  dismiss(event) {
    $(event.target).closest('.modal').modal('hide');
  },
  maxNewOfferAmount() {
    let maxAmount = '0';
    if (this.offerType() === 'sell') {
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
  maxNewOfferTotal() {
    // Only allow change of total if price is well-defined
    try {
      const price = new BigNumber(this.offerPrice());
      if ((price.isNaN() || price.isZero() || price.isNegative())) {
        return '0';
      }
    } catch (e) {
      return '0';
    }
    // If price is well-defined, take minimum of balance and allowance of currency, if 'buy', otherwise Infinity
    let maxTotal = '0';
    if (this.offerType() === 'buy') {
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
  canSubmit() {
    try {
      const type = this.offerType();
      const price = new BigNumber(this.offerPrice());
      const amount = new BigNumber(this.offerAmount());
      const maxAmount = new BigNumber(this.maxNewOfferAmount());
      const total = new BigNumber(this.offerTotal());
      const maxTotal = new BigNumber(this.maxNewOfferTotal());
      const marketOpen = Session.get('market_open');
      const validTokenPair = Session.get('quoteCurrency') !== Session.get('baseCurrency');
      return marketOpen && price.gt(0) && amount.gt(0) && total.gt(0) && validTokenPair &&
        (type !== 'buy' || total.lte(maxTotal)) && (type !== 'sell' || amount.lte(maxAmount));
    } catch (e) {
      return false;
    }
  },
  newOfferParameters() {
    let sellHowMuch;
    let sellWhichToken;
    let buyHowMuch;
    let buyWhichToken;
    if (this.offerType() === 'buy') {
      sellWhichToken = Session.get('quoteCurrency');
      sellHowMuch = this.offerTotal();
      buyWhichToken = Session.get('baseCurrency');
      buyHowMuch = this.offerAmount();
    } else {
      sellWhichToken = Session.get('baseCurrency');
      sellHowMuch = this.offerAmount();
      buyWhichToken = Session.get('quoteCurrency');
      buyHowMuch = this.offerTotal();
    }
    return { sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken };
  },
  estimateGasUsage() {
    this.gasEstimateResult(null);
    this.gasEstimateError(null);
    if (this.canSubmit()) {
      this.gasEstimateInProgress(true);

      const {sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken} = this.newOfferParameters();
      latest(Offers.newOfferGasEstimate)(sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken)
        .then((result) => {
          if (this.gasEstimateInProgress()) {
            this.gasEstimateError(null);
            this.gasEstimateResult(result);
            this.gasEstimateInProgress(false);
          }
        })
        .catch((error) => {
          if (this.gasEstimateInProgress()) {
            this.gasEstimateError(error);
            this.gasEstimateResult(null);
            this.gasEstimateInProgress(false);
          }
        });
    }
    else {
      this.gasEstimateInProgress(false);
    }
  },
  confirmOffer(event) {
    event.preventDefault();
    this.offerError('');

    const {sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken} = this.newOfferParameters();
    Offers.newOffer(sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken, (error) => {
      if (error != null) {
        this.offerError(formatError(error));
      }
      // Cleaning inputs
      $('.row-input-line input[type=number]').val(0);
    });
  },
});

Template.offermodal.events({
  'click button.btn-allowance-modal': (event) => {
    const refer = $(event.target).data('refer');
    const token = $(event.target).data('link');
    $(`#allowanceModal${token}`).data('refer', refer);
    $(`#allowanceModal${token}`).modal('show');
  },
});

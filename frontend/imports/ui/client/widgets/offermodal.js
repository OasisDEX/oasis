import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { BigNumber } from 'meteor/ethereum:web3';
import { web3Obj } from 'meteor/makerotc:dapple';
import { formatError } from '/imports/utils/functions';
import { convertToTokenPrecision } from '/imports/utils/conversion';

import Tokens from '/imports/api/tokens';
import Limits from '/imports/api/limits';
import { Offers, Status } from '/imports/api/offers';

import './offermodal.html';

// TODO: DELETE THIS, TESTING PURPOSE
window.Tokens = Tokens;

const latest = require('promise-latest');

Template.offermodal.viewmodel({
  share: 'newOffer',
  volume: '',
  total: '',
  priceInUSD: '',
  gasEstimateInProgress: false,
  gasEstimateMoreThanGasLimit: false,
  gasEstimateResult: null,
  gasEstimateError: null,
  autorun() {
    this.estimateGasUsage();
    this.fetchCurrentPriceInUSD();
    if (Template.currentData().offer) {
      const buyHowMuch = web3Obj.fromWei(new BigNumber(Template.currentData().offer.buyHowMuch)).toString(10);
      const sellHowMuch = web3Obj.fromWei(new BigNumber(Template.currentData().offer.sellHowMuch)).toString(10);
      const baseCurrency = Session.get('baseCurrency');
      if (baseCurrency === Template.currentData().offer.buyWhichToken) {
        this.volume(buyHowMuch);
        this.total(sellHowMuch);
      } else {
        this.volume(sellHowMuch);
        this.total(buyHowMuch);
      }
    }
  },
  precision() {
    return Dapple.getTokenSpecs(Session.get('baseCurrency')).precision;
  },
  validAmount: true,
  validNewOrderAmount: true,
  type() {
    if (Template.currentData().offer) {
      return Template.currentData().offer.type();
    }
    return '';
  },
  buyCurrency() {
    return this.type() === 'bid' ? Session.get('quoteCurrency') : Session.get('baseCurrency');
  },
  sellCurrency() {
    return this.type() === 'bid' ? Session.get('baseCurrency') : Session.get('quoteCurrency');
  },
  quoteToken() {
    return Tokens.findOne(Session.get('quoteCurrency'));
  },
  baseToken() {
    return Tokens.findOne(Session.get('baseCurrency'));
  },
  hasBalance() {
    try {
      const token = Tokens.findOne(this.sellCurrency());
      const balance = new BigNumber(token.balance);
      return token && balance.gte(web3Obj.toWei(new BigNumber(this.type() === 'bid' ? this.volume() : this.total())));
    } catch (e) {
      return false;
    }
  },
  hasAllowance() {
    try {
      const token = Tokens.findOne(this.sellCurrency());
      const allowance = new BigNumber(token.allowance);
      return token && allowance.gte(web3Obj.toWei(new BigNumber(this.type() === 'bid' ? this.volume() : this.total())));
    } catch (e) {
      return false;
    }
  },
  hasAllowanceNewOrder() {
    try {
      const token = Tokens.findOne(this.offerType() === 'buy'
        ? Session.get('quoteCurrency') : Session.get('baseCurrency'));
      const allowance = new BigNumber(token.allowance);

      return token && allowance.gte(web3Obj.toWei(new BigNumber(this.offerType() === 'buy'
          ? this.offerTotal() : this.offerAmount())));
    } catch (e) {
      return false;
    }
  },
  limit() {
    const sellToken = this.offerType() === 'buy' ? Session.get('quoteCurrency') : Session.get('baseCurrency');
    return Limits.limitForToken(sellToken);
  },
  aboveLimit() {
    try {
      const sellToken = this.offerType() === 'buy' ? Session.get('quoteCurrency') : Session.get('baseCurrency');
      const sellAmount = this.offerType() === 'buy' ? this.offerTotal() : this.offerAmount();
      const sellAmountAbsolute = new BigNumber(convertToTokenPrecision(sellAmount, sellToken));
      return sellAmountAbsolute.greaterThanOrEqualTo(Limits.limitForToken(sellToken));
    } catch (e) {
      return true;
    }
  },
  hasVolume() {
    try {
      const volume = new BigNumber(Template.currentData().offer.volume(this.buyCurrency()));
      return volume.gte(web3Obj.toWei(new BigNumber(this.type() === 'bid' ? this.total() : this.volume())));
    } catch (e) {
      return false;
    }
  },
  maxVolume() {
    let maxVolume = '0';
    try {
      const baseCurrency = Session.get('baseCurrency');
      const volume = new BigNumber(Template.currentData().offer.volume(baseCurrency));
      if (Template.currentData().offer.buyWhichToken === baseCurrency) {
        // Calculate max volume, since we want to sell MKR, we need to check how much MKR we can sell
        const token = Tokens.findOne(baseCurrency);
        if (token) {
          // Can at most sell balance, allowance, and offer's volume
          const balance = new BigNumber(token.balance);
          const allowance = new BigNumber(token.allowance);
          maxVolume = web3Obj.fromWei(BigNumber.min(balance, allowance, volume)).toString(10);
        }
      } else {
        maxVolume = web3Obj.fromWei(volume).toString(10);
      }
    } catch (e) {
      maxVolume = '0';
    }
    return maxVolume;
  },
  maxTotal() {
    let maxTotal = '0';
    try {
      const quoteCurrency = Session.get('quoteCurrency');
      const total = new BigNumber(Template.currentData().offer.volume(quoteCurrency));
      if (Template.currentData().offer.buyWhichToken === quoteCurrency) {
        // Calculate max total, since we want to buy MKR, we need to check how much of the currency is available
        const token = Tokens.findOne(quoteCurrency);
        if (token) {
          // Can at most buy balance, allowance, and offer's total
          const balance = new BigNumber(token.balance);
          const allowance = new BigNumber(token.allowance);
          maxTotal = web3Obj.fromWei(BigNumber.min(balance, allowance, total)).toString(10);
        }
      } else {
        maxTotal = web3Obj.fromWei(total).toString(10);
      }
    } catch (e) {
      maxTotal = '0';
    }
    return maxTotal;
  },
  calcVolume() {
    this.validAmount(true);
    if (this.precision() === 0 && this.total() % 1 !== 0) {
      this.validAmount(false);
      this.volume('0');
      return;
    }
    try {
      const baseCurrency = Session.get('baseCurrency');
      const total = new BigNumber(this.total());
      const buyHowMuch = new BigNumber(this.templateInstance.data.offer.buyHowMuch);
      const sellHowMuch = new BigNumber(this.templateInstance.data.offer.sellHowMuch);
      if (this.templateInstance.data.offer.buyWhichToken === baseCurrency) {
        this.volume(buyHowMuch.div(sellHowMuch).times(total).toString(10));
      } else {
        this.volume(sellHowMuch.div(buyHowMuch).times(total).toString(10));
      }
    } catch (e) {
      this.volume('0');
    }
  },
  calcTotal() {
    this.validAmount(true);
    if (this.precision() === 0 && this.volume() % 1 !== 0) {
      this.validAmount(false);
      this.total('0');
      return;
    }
    try {
      const baseCurrency = Session.get('baseCurrency');
      const volume = new BigNumber(this.volume());
      const buyHowMuch = new BigNumber(this.templateInstance.data.offer.buyHowMuch);
      const sellHowMuch = new BigNumber(this.templateInstance.data.offer.sellHowMuch);
      if (this.templateInstance.data.offer.buyWhichToken === baseCurrency) {
        this.total(sellHowMuch.div(buyHowMuch).times(volume).toString(10));
      } else {
        this.total(buyHowMuch.div(sellHowMuch).times(volume).toString(10));
      }
    } catch (e) {
      this.total('0');
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
  alertBetterOffer() {
    let bestOffer = null;
    const dustLimitMap = Session.get('orderBookDustLimit');
    const dustLimit = dustLimitMap[Session.get('quoteCurrency')] ? dustLimitMap[Session.get('quoteCurrency')] : 0;

    if (this.type() === 'bid') {
      bestOffer = Offers.findOne({
          buyWhichToken: Session.get('baseCurrency'),
          sellWhichToken: Session.get('quoteCurrency'),
          sellHowMuch_filter: { $gte: dustLimit },
        },
        {
          sort: { ask_price_sort: 1 },
        });
      return (new BigNumber(bestOffer.bid_price)).gt(new BigNumber(this.templateInstance.data.offer.bid_price));
    } else if (this.type() === 'ask') {
      bestOffer = Offers.findOne({
          buyWhichToken: Session.get('quoteCurrency'),
          sellWhichToken: Session.get('baseCurrency'),
          buyHowMuch_filter: { $gte: dustLimit },
        },
        {
          sort: { ask_price_sort: 1 },
        });
      return (new BigNumber(bestOffer.ask_price)).lt(new BigNumber(this.templateInstance.data.offer.ask_price));
    }
    return false;
  },
  dismiss(event) {
    $(event.target).closest('.modal').modal('hide');
  },
  canBuy() {
    try {
      if (Template.currentData().offer.status !== Status.CONFIRMED) {
        return false;
      }
      const volume = new BigNumber(this.volume());
      const total = new BigNumber(this.total());
      const marketOpen = Session.get('market_open');
      return marketOpen && !total.isNaN() && total.gt(0) && total.lte(new BigNumber(this.maxTotal()))
        && !volume.isNaN() && volume.gt(0) && volume.lte(new BigNumber(this.maxVolume()));
    } catch (e) {
      return false;
    }
  },
  buy() {
    const offerId = this.templateInstance.data.offer._id;
    const offer = Offers.findOne(offerId);

    if (this.templateInstance.data.offer.type() === 'bid') {
      Offers.buyOffer(offerId, 'sell', new BigNumber(this.total()), offer.sellWhichToken);
    } else {
      Offers.buyOffer(offerId, 'buy', new BigNumber(this.volume()), offer.sellWhichToken);
    }
  },
  maxNewOfferAmount() {
    let maxAmount = '0';
    if (this.offerType() === 'sell') {
      const token = Tokens.findOne(Session.get('baseCurrency'));
      if (token) {
        const balance = new BigNumber(token.balance);
        const allowance = new BigNumber(token.allowance);
        maxAmount = web3Obj.fromWei(BigNumber.min(balance, allowance).toString(10));
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
        maxTotal = web3Obj.fromWei(BigNumber.min(balance, allowance).toString(10));
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
      const aboveLimit = this.aboveLimit();
      const validTokenPair = Session.get('quoteCurrency') !== Session.get('baseCurrency');
      return marketOpen && price.gt(0) && amount.gt(0) && total.gt(0) && validTokenPair && aboveLimit &&
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
    this.gasEstimateMoreThanGasLimit(false);
    this.gasEstimateError(null);
    if (this.canSubmit()) {
      this.gasEstimateInProgress(true);

      const { sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken } = this.newOfferParameters();
      latest(Offers.newOfferGasEstimate)(sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken)
        .then((result) => {
          if (this.gasEstimateInProgress()) {
            this.gasEstimateError(null);
            this.gasEstimateResult(result[0]);
            this.gasEstimateMoreThanGasLimit(result[0] > result[1]);
            this.gasEstimateInProgress(false);
          }
        })
        .catch((error) => {
          if (this.gasEstimateInProgress()) {
            this.gasEstimateError(error);
            this.gasEstimateResult(null);
            this.gasEstimateMoreThanGasLimit(false);
            this.gasEstimateInProgress(false);
          }
        });
    } else {
      this.gasEstimateInProgress(false);
    }
  },
  confirmOffer(event) {
    event.preventDefault();
    this.offerError('');

    const { sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken } = this.newOfferParameters();
    Offers.newOffer(sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken, (error) => {
      if (error != null) {
        this.offerError(formatError(error));
      }
      // Cleaning inputs
      Session.set('selectedOrder', '');
      $('.row-input-line input[type=number]').val('');
      $('.row-input-line input[type=number]').trigger('change');
    });
  },
  fetchCurrentPriceInUSD() {
    if (!this.priceInUSD()) {
      $.get('https://api.coinmarketcap.com/v1/ticker/ethereum/', (data) => {
        this.priceInUSD(data[0].price_usd);
      }).fail((error) => console.debug(error));
    }
  },
});

Template.offermodal.events({
  'click button.btn-allowance-modal': (event) => {
    const refer = $(event.target).data('refer');
    const token = $(event.target).data('link');
    const allowance = Template.instance().viewmodel.offerAmount();
    $(`#allowanceModal${token}`).data('refer', refer);
    $(`#allowanceModal${token}`).modal('show');
    $(`#allowanceModal${token}`).on('shown.bs.modal', () => {
      $('.set-allowance input').focus();
      $('.set-allowance input').val(allowance);
      // changing value of input using val(), doesn't trigger onchange event. it must be manually triggered
      $('.set-allowance input').trigger('change');
    });
  },
});

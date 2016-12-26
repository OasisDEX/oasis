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


Template.offermodal.viewmodel({
  share: 'newOffer',
  volume: '',
  total: '',
  autorun() {
    if (Template.currentData().offer) {
      const buyHowMuch = web3.fromWei(new BigNumber(Template.currentData().offer.buyHowMuch)).toString(10);
      const sellHowMuch = web3.fromWei(new BigNumber(Template.currentData().offer.sellHowMuch)).toString(10);
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
  hasBalance() {
    try {
      const token = Tokens.findOne(this.sellCurrency());
      const balance = new BigNumber(token.balance);
      return token && balance.gte(web3.toWei(new BigNumber(this.type() === 'bid' ? this.volume() : this.total())));
    } catch (e) {
      return false;
    }
  },
  hasAllowance() {
    try {
      const token = Tokens.findOne(this.sellCurrency());
      const allowance = new BigNumber(token.allowance);
      return token && allowance.gte(web3.toWei(new BigNumber(this.type() === 'bid' ? this.volume() : this.total())));
    } catch (e) {
      return false;
    }
  },
  hasVolume() {
    try {
      const volume = new BigNumber(Template.currentData().offer.volume(this.buyCurrency()));
      return volume.gte(web3.toWei(new BigNumber(this.type() === 'bid' ? this.total() : this.volume())));
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
          maxVolume = web3.fromWei(BigNumber.min(balance, allowance, volume)).toString(10);
        }
      } else {
        maxVolume = web3.fromWei(volume).toString(10);
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
          maxTotal = web3.fromWei(BigNumber.min(balance, allowance, total)).toString(10);
        }
      } else {
        maxTotal = web3.fromWei(total).toString(10);
      }
    } catch (e) {
      maxTotal = '0';
    }
    return maxTotal;
  },
  calcVolume() {
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
  dismiss(event) {
    $(event.target).closest('.modal').modal('hide');
  },
  cancel() {
    const offerId = this.templateInstance.data.offer._id;
    Offers.cancelOffer(offerId);
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
      Offers.buyOffer(offerId, new BigNumber(this.total()), offer.sellWhichToken);
    } else {
      Offers.buyOffer(offerId, new BigNumber(this.volume()), offer.sellWhichToken);
    }
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
  confirmOffer(event) {
    event.preventDefault();

    this.offerError('');
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
    Offers.newOffer(sellHowMuch, sellWhichToken, buyHowMuch, buyWhichToken, (error) => {
      if (error != null) {
        this.offerError(formatError(error));
      }
    });
  },
  showAllowanceModal() {
    $('#allowanceModal').modal('show');
  },
});

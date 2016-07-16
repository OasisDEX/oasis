Template.offermodal.viewmodel({
  volume: '',
  total: '',
  autorun: function () {
    if (Template.currentData().offer) {
      var buy_how_much = web3.fromWei(new BigNumber(Template.currentData().offer.buy_how_much)).toString(10)
      var sell_how_much = web3.fromWei(new BigNumber(Template.currentData().offer.sell_how_much)).toString(10)
      var baseCurrency = Session.get('baseCurrency')
      if (baseCurrency === Template.currentData().offer.buy_which_token) {
        this.volume(buy_how_much)
        this.total(sell_how_much)
      } else {
        this.volume(sell_how_much)
        this.total(buy_how_much)
      }
    }
  },
  type: function () {
    if (Template.currentData().offer) {
      return Template.currentData().offer.type()
    }
  },
  buyCurrency: function () {
    return this.type() === 'bid' ? Session.get('quoteCurrency') : Session.get('baseCurrency')
  },
  sellCurrency: function () {
    return this.type() === 'bid' ? Session.get('baseCurrency') : Session.get('quoteCurrency')
  },
  hasBalance: function () {
    try {
      var token = Tokens.findOne(this.sellCurrency())
      var balance = new BigNumber(token.balance)
      return token && balance.gte(web3.toWei(new BigNumber(this.type() === 'bid' ? this.volume() : this.total())))
    } catch (e) {
      return false
    }
  },
  hasAllowance: function () {
    try {
      var token = Tokens.findOne(this.sellCurrency())
      var allowance = new BigNumber(token.allowance)
      return token && allowance.gte(web3.toWei(new BigNumber(this.type() === 'bid' ? this.volume() : this.total())))
    } catch (e) {
      return false
    }
  },
  hasVolume: function () {
    try {
      var volume = new BigNumber(Template.currentData().offer.volume(this.buyCurrency()))
      return volume.gte(web3.toWei(new BigNumber(this.type() === 'bid' ? this.total() : this.volume())))
    } catch (e) {
      return false
    }
  },
  maxVolume: function () {
    try {
      var baseCurrency = Session.get('baseCurrency')
      var volume = new BigNumber(Template.currentData().offer.volume(baseCurrency))
      if (Template.currentData().offer.buy_which_token === baseCurrency) {
        // Calculate max volume, since we want to sell MKR, we need to check how much MKR we can sell
        var token = Tokens.findOne(baseCurrency)
        if (!token) {
          return '0'
        } else {
          // Can at most sell balance, allowance, and offer's volume
          var balance = new BigNumber(token.balance)
          var allowance = new BigNumber(token.allowance)
          return web3.fromWei(BigNumber.min(balance, allowance, volume)).toString(10)
        }
      } else {
        return web3.fromWei(volume).toString(10)
      }
    } catch (e) {
      return '0'
    }
  },
  maxTotal: function () {
    try {
      var quoteCurrency = Session.get('quoteCurrency')
      var total = new BigNumber(Template.currentData().offer.volume(quoteCurrency))
      if (Template.currentData().offer.buy_which_token === quoteCurrency) {
        // Calculate max total, since we want to buy MKR, we need to check how much of the currency is available
        var token = Tokens.findOne(quoteCurrency)
        if (!token) {
          return '0'
        } else {
          // Can at most buy balance, allowance, and offer's total
          var balance = new BigNumber(token.balance)
          var allowance = new BigNumber(token.allowance)
          return web3.fromWei(BigNumber.min(balance, allowance, total)).toString(10)
        }
      } else {
        return web3.fromWei(total).toString(10)
      }
    } catch (e) {
      return '0'
    }
  },
  calcVolume: function () {
    try {
      var baseCurrency = Session.get('baseCurrency')
      var total = new BigNumber(this.total())
      var buy_how_much = new BigNumber(this.templateInstance.data.offer.buy_how_much)
      var sell_how_much = new BigNumber(this.templateInstance.data.offer.sell_how_much)
      if (this.templateInstance.data.offer.buy_which_token === baseCurrency) {
        this.volume(buy_how_much.div(sell_how_much).times(total).toString(10))
      } else {
        this.volume(sell_how_much.div(buy_how_much).times(total).toString(10))
      }
    } catch (e) {
      this.volume('0')
    }
  },
  calcTotal: function () {
    try {
      var baseCurrency = Session.get('baseCurrency')
      var volume = new BigNumber(this.volume())
      var buy_how_much = new BigNumber(this.templateInstance.data.offer.buy_how_much)
      var sell_how_much = new BigNumber(this.templateInstance.data.offer.sell_how_much)
      if (this.templateInstance.data.offer.buy_which_token === baseCurrency) {
        this.total(sell_how_much.div(buy_how_much).times(volume).toString(10))
      } else {
        this.total(buy_how_much.div(sell_how_much).times(volume).toString(10))
      }
    } catch (e) {
      this.total('0')
    }
  },
  dismiss: function (event) {
    $(event.target).closest('.modal').modal('hide')
  },
  cancel: function () {
    var _id = this.templateInstance.data.offer._id
    Offers.cancelOffer(_id)
  },
  canBuy: function () {
    try {
      if (Template.currentData().offer.status !== Status.CONFIRMED) {
        return false
      }
      var volume = new BigNumber(this.volume())
      var total = new BigNumber(this.total())
      return !total.isNaN() && total.gt(0) && total.lte(new BigNumber(this.maxTotal())) && !volume.isNaN() && volume.gt(0) && volume.lte(new BigNumber(this.maxVolume()))
    } catch (e) {
      return false
    }
  },
  buy: function () {
    var _id = this.templateInstance.data.offer._id
    if (this.templateInstance.data.offer.type() === 'bid') {
      Offers.buyOffer(_id, web3.toWei(new BigNumber(this.total())))
    } else {
      Offers.buyOffer(_id, web3.toWei(new BigNumber(this.volume())))
    }
  }
})

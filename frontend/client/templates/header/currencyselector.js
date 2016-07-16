Template.currencySelector.viewmodel({
  autorun: function () {
    this.quoteCurrency(Session.get('quoteCurrency'))
    this.baseCurrency(Session.get('baseCurrency'))
  },
  currencies: Dapple.getTokens(),
  quoteCurrency: '',
  baseCurrency: '',
  quoteHelper: '',
  baseHelper: '',
  quoteChange: function () {
    var _this = this
    // XXX EIP20
    Dapple.getToken(_this.quoteCurrency(), function (error, token) {
      if (!error) {
        token.totalSupply(function (error, supply) {
          if (!error) {
            _this.quoteHelper('')
            localStorage.setItem('quoteCurrency', _this.quoteCurrency())
            Session.set('quoteCurrency', _this.quoteCurrency())
            Tokens.sync()
          } else {
            _this.quoteHelper('Token not found')
          }
        })
      } else {
        _this.quoteHelper('Token not found')
      }
    })
  },
  baseChange: function () {
    var _this = this
    // XXX EIP20
    Dapple.getToken(_this.baseCurrency(), function (error, token) {
      if (!error) {
        token.totalSupply(function (error, supply) {
          if (!error) {
            _this.baseHelper('')
            localStorage.setItem('baseCurrency', _this.baseCurrency())
            Session.set('baseCurrency', _this.baseCurrency())
            Tokens.sync()
          } else {
            _this.baseHelper('Token not found')
          }
        })
      } else {
        _this.baseHelper('Token not found')
      }
    })
  }
})

Template.currencySelector.events({
  'click #spnSwitchCurrencies': function () {
    var quoteCurrency = Session.get('quoteCurrency')
    var baseCurrency = Session.get('baseCurrency')
    Session.set('quoteCurrency', baseCurrency)
    Session.set('baseCurrency', quoteCurrency)
  }
})

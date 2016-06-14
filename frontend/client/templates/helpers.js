Template.registerHelper('contractExists', function () {
  var network = Session.get('network')
  var isConnected = Session.get('isConnected')
  var exists = Session.get('contractExists')
  return network !== false && isConnected === true && exists === true
})

Template.registerHelper('network', function () {
  return Session.get('network')
})

Template.registerHelper('contractAddress', function () {
  return Dapple['maker-otc'].objects.otc.address
})

Template.registerHelper('contractHref', function () {
  var network = Session.get('network')
  return 'https://' + (network === 'test' ? 'testnet.' : '') + 'etherscan.io/address/' + Dapple['maker-otc'].objects.otc.address
})

Template.registerHelper('rpccorsdomain', function () {
  return window.location.origin
})

Template.registerHelper('usingHttps', function () {
  return window.location.protocol === 'https:'
})

Template.registerHelper('ready', function () {
  return Session.get('isConnected') && !Session.get('syncing') && !Session.get('outOfSync')
})

Template.registerHelper('isConnected', function () {
  return Session.get('isConnected')
})

Template.registerHelper('outOfSync', function () {
  return Session.get('outOfSync')
})

Template.registerHelper('syncing', function () {
  return Session.get('syncing')
})

Template.registerHelper('syncingPercentage', function () {
  var startingBlock = Session.get('startingBlock')
  var currentBlock = Session.get('currentBlock')
  var highestBlock = Session.get('highestBlock')
  return Math.round(100 * (currentBlock - startingBlock) / (highestBlock - startingBlock))
})

Template.registerHelper('loading', function () {
  return Session.get('loading')
})

Template.registerHelper('loadingProgress', function () {
  return Session.get('loadingProgress')
})

Template.registerHelper('address', function () {
  return Session.get('address')
})

Template.registerHelper('ETHBalance', function () {
  return Session.get('ETHBalance')
})

Template.registerHelper('allTokens', function () {
  var quoteCurrency = Session.get('quoteCurrency')
  var baseCurrency = Session.get('baseCurrency')
  return _.uniq([ quoteCurrency, baseCurrency ]).map(function (token) { return Tokens.findOne(token) })
})

Template.registerHelper('findToken', function (token) {
  return Tokens.findOne(token)
})

Template.registerHelper('lastTrades', function () {
  var quoteCurrency = Session.get('quoteCurrency')
  var baseCurrency = Session.get('baseCurrency')
  var obj = { $or: [
    { buy_which_token: quoteCurrency, sell_which_token: baseCurrency },
    { buy_which_token: baseCurrency, sell_which_token: quoteCurrency }
  ] }
  return Trades.find(obj, { sort: { blockNumber: -1, transactionIndex: -1 }, limit: 10 })
})

Template.registerHelper('findOffers', function (type) {
  var quoteCurrency = Session.get('quoteCurrency')
  var baseCurrency = Session.get('baseCurrency')
  var address = Session.get('address')
  if (type === 'ask') {
    return Offers.find({ buy_which_token: quoteCurrency, sell_which_token: baseCurrency }, { sort: { ask_price: 1 }, limit: 10 })
  } else if (type === 'bid') {
    return Offers.find({ buy_which_token: baseCurrency, sell_which_token: quoteCurrency }, { sort: { ask_price: 1 }, limit: 10 })
  } else if (type === 'mine') {
    var or = [
      { buy_which_token: quoteCurrency, sell_which_token: baseCurrency },
      { buy_which_token: baseCurrency, sell_which_token: quoteCurrency }
    ]
    return Offers.find({ owner: address, $or: or })
  } else {
    return []
  }
})

Template.registerHelper('findOffer', function (id) {
  return Offers.findOne(id)
})

Template.registerHelper('selectedOffer', function () {
  return Session.get('selectedOffer')
})

Template.registerHelper('quoteCurrency', function () {
  return Session.get('quoteCurrency')
})

Template.registerHelper('baseCurrency', function () {
  return Session.get('baseCurrency')
})

Template.registerHelper('priceCurrency', function () {
  return PRICE_CURRENCY
})

Template.registerHelper('equals', function (a, b) {
  return a === b
})

Template.registerHelper('not', function (b) {
  return !b
})

Template.registerHelper('concat', function () {
  return Array.prototype.slice.call(arguments, 0, -1).join('')
})

Template.registerHelper('timestampToString', function (ts, inSeconds) {
  if (ts) {
    if (inSeconds === true) {
      return new Date(1000 * ts).toLocaleString()
    } else {
      return new Date(ts).toLocaleString()
    }
  } else {
    return ''
  }
})

Template.registerHelper('fromWei', function (s) {
  return web3.fromWei(s)
})

Template.registerHelper('toWei', function (s) {
  return web3.toWei(s)
})

Template.registerHelper('formatBalance', function (wei, format) {
  if (format instanceof Spacebars.kw) {
    format = null
  }
  format = format || '0,0.00[0000]'

  return EthTools.formatBalance(wei, format)
})

Template.registerHelper('formatPrice', function (value, currency) {
  try {
    var format = '0,0.00[0000]'
    if (!(value instanceof BigNumber)) {
      value = new BigNumber(value)
    }

    if (currency === 'ETH') {
      var usd = EthTools.ticker.findOne('usd')
      if (usd) {
        var usdValue = value.times(usd.price)
        return '(~' + EthTools.formatBalance(usdValue, format) + ' USD)'
      }
    }
    // TODO: other exchange rates
    return ''
  } catch (e) {
    return ''
  }
})

var TRANSFER_GAS = 150000
var TRANSACTION_TYPE = 'transfer'

Template.sendtokens.viewmodel({
  currency: 'MKR',
  currencies: Dapple.getTokens(),
  recipient: '',
  lastError: '',
  pending: function () {
    return Transactions.findType(TRANSACTION_TYPE)
  },
  amount: '0',
  maxAmount: function () {
    try {
      var token = Tokens.findOne(this.currency())
      return web3.fromWei(token.balance).toString(10)
    } catch (e) {
      return '0'
    }
  },
  canTransfer: function () {
    try {
      var amount = new BigNumber(this.amount())
      var maxAmount = new BigNumber(this.maxAmount())
      var recipient = this.recipient()
      return /^(0x)?[0-9a-f]{40}$/i.test(recipient) && amount.gt(0) && amount.lte(maxAmount)
    } catch (e) {
      return false
    }
  },
  transfer: function (event) {
    event.preventDefault()

    var _this = this
    _this.lastError('')

    var recipient = _this.recipient().toLowerCase()
    if (!(/^0x/.test(recipient))) {
      recipient = '0x' + recipient
    }

    var options = { gas: TRANSFER_GAS }

    // XXX EIP20
    Dapple.getToken(_this.currency(), function (error, token) {
      if (!error) {
        token.transfer(recipient, web3.toWei(_this.amount()), options, function (error, tx) {
          if (!error) {
            Transactions.add(TRANSACTION_TYPE, tx, { recipient: recipient, amount: _this.amount(), token: _this.currency() })
          } else {
            _this.lastError(error.toString())
          }
        })
      } else {
        _this.lastError(error.toString())
      }
    })
  }
})

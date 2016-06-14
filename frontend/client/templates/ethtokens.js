var TRANSACTION_TYPE = 'ethtokens'
var DEPOSIT_GAS = 150000
var WITHDRAW_GAS = 150000

Template.ethtokens.viewmodel({
  type: 'deposit',
  amount: '',
  lastError: '',
  pending: function () {
    return Transactions.findType(TRANSACTION_TYPE)
  },
  maxAmount: function () {
    try {
      if (this.type() === 'deposit') {
        return web3.fromWei(Session.get('ETHBalance'))
      } else {
        return web3.fromWei(Tokens.findOne('ETH').balance)
      }
    } catch (e) {
      return '0'
    }
  },
  canDeposit: function () {
    try {
      var amount = new BigNumber(this.amount())
      var maxAmount = new BigNumber(this.maxAmount())
      return amount.gt(0) && amount.lte(maxAmount)
    } catch (e) {
      return false
    }
  },
  deposit: function (event) {
    event.preventDefault()

    var _this = this
    _this.lastError('')

    if (_this.type() === 'deposit') {
      var options = {
        gas: DEPOSIT_GAS,
        value: web3.toWei(_this.amount())
      }
      // XXX EIP20
      Dapple.getToken('ETH', function (error, token) {
        if (!error) {
          token.deposit(options, function (error, tx) {
            if (!error) {
              Transactions.add(TRANSACTION_TYPE, tx, { type: 'deposit', amount: _this.amount() })
            } else {
              _this.lastError(error.toString())
            }
          })
        } else {
          _this.lastError(error.toString())
        }
      })
    } else {
      // XXX EIP20
      Dapple.getToken('ETH', function (error, token) {
        if (!error) {
          token.withdraw(web3.toWei(_this.amount()), { gas: WITHDRAW_GAS }, function (error, tx) {
            if (!error) {
              Transactions.add(TRANSACTION_TYPE, tx, { type: 'withdraw', amount: _this.amount() })
            } else {
              _this.lastError(error.toString())
            }
          })
        } else {
          _this.lastError(error.toString())
        }
      })
    }
  }
})

var APPROVE_GAS = 150000

Template.newallowance.viewmodel({
  value: '',
  allowance: function () {
    return Template.currentData().token.allowance
  },
  pending: function () {
    return Transactions.findType('allowance_' + Template.currentData().token._id)
  },
  lastError: '',
  autorun: function () {
    // Initialize value
    this.value(web3.fromWei(this.templateInstance.data.token.allowance))
  },
  canChange: function () {
    try {
      return this.pending().length === 0 && this.value() !== '' && !(new BigNumber(this.value()).equals(new BigNumber(web3.fromWei(this.allowance()))))
    } catch (e) {
      return false
    }
  },
  change: function (event) {
    event.preventDefault()

    var _this = this
    _this.lastError('')

    var contract_address = Dapple['maker-otc'].objects.otc.address
    var options = { gas: APPROVE_GAS }

    // XXX EIP20
    Dapple.getToken(_this.templateInstance.data.token._id, function (error, token) {
      if (!error) {
        token.approve(contract_address, web3.toWei(_this.value()), options, function (error, tx) {
          if (!error) {
            Transactions.add('allowance_' + _this.templateInstance.data.token._id, tx, { value: _this.value(), token: _this.templateInstance.data.token._id })
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

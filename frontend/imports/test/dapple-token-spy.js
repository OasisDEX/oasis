class DappleTokenSpy {
  constructor(canLookup, canCall) {
    this.canLookup = canLookup
    this.canCall = canCall
    this.lastCall = {}
  }
  getToken(tokenName, tokenCb) {
    var _this = this
    if (this.canLookup) {
      let token = {
        deposit: function (options, cb) {
          this.lastCall = {
            fn: 'deposit',
            options: options
          }
          if (_this.canCall) {
            cb(false, 'txid')
          } else {
            cb('token.deposit call error', null)
          }
        },
        withdraw: function (amount, options, cb) {
          this.lastCall = {
            fn: 'withdraw',
            amount: amount,
            options: options
          }
          if (_this.canCall) {
            cb(false, 'txid')
          } else {
            cb('token.withdraw call error', null)
          }
        }
      }
      tokenCb(false, token)
    } else {
      tokenCb('token lookup error', null)
    }
  }
}

export { DappleTokenSpy };
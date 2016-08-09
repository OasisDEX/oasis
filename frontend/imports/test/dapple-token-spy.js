export default class DappleTokenSpy {
  constructor(canLookup, canCall) {
    this.canLookup = canLookup;
    this.canCall = canCall;
    this.lastCall = {};
  }
  getToken(tokenName, tokenCb) {
    if (this.canLookup) {
      const token = {
        deposit: (options, cb) => {
          this.lastCall = {
            fn: 'deposit',
            options,
          };
          if (this.canCall) {
            cb(false, 'txid');
          } else {
            cb('token.deposit call error', null);
          }
        },
        withdraw: (amount, options, cb) => {
          this.lastCall = {
            fn: 'withdraw',
            amount,
            options,
          };
          if (this.canCall) {
            cb(false, 'txid');
          } else {
            cb('token.withdraw call error', null);
          }
        },
      };
      tokenCb(false, token);
    } else {
      tokenCb('token lookup error', null);
    }
  }
}

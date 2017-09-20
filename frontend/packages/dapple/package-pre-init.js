// console.log('package-pre-init start')
import { Session } from 'meteor/session';

// const metamask = require('metamascara');

Session.set('web3ObjReady', false);

web3Obj = new Web3(metamask.createDefaultProvider({}));
initWeb3();

function initWeb3() {
  window.web3 = web3Obj;
  Session.set('web3ObjReady', true);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = web3Obj;
}

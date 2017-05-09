// console.log('package-pre-init start')
import { Session } from 'meteor/session';

web3Obj = new Web3();
Session.set('web3ObjReady', false);
setTimeout(
  function() {
    if (window.web3) {
      web3Obj.setProvider(window.web3.currentProvider);
      console.log('Using current provider');
    } else {
      web3Obj.setProvider(new Web3.providers.HttpProvider('http://localhost:8545'));
      console.log('Using new provider');
    }
    window.web3 = web3Obj;
    Session.set('web3ObjReady', true);
  }, 300)
// console.log('package-pre-init done')

if (typeof module !== 'undefined' && module.exports) {
  module.exports = web3Obj;
}

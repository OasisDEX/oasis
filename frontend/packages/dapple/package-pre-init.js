// console.log('package-pre-init start')
import { Session } from 'meteor/session';

web3Obj = new Web3();
Session.set('web3ObjReady', false);
Session.set('web3Counter', 0);

const web3Interval = setInterval(
  function() {
    if (window.web3) {
      web3Obj.setProvider(window.web3.currentProvider);
      window.web3 = web3Obj;
      Session.set('web3ObjReady', true);
      console.log('Using current provider');
      clearInterval(Session.get('web3Interval'));
      Session.delete('web3Interval');
    } else {
      let counter = Session.get('web3Counter');
      counter++;
      Session.set('web3Counter', counter);
      if (counter >= 3) {
        clearInterval(Session.get('web3Interval'));
        Session.delete('web3Interval');
        web3Obj.setProvider(new Web3.providers.HttpProvider('http://localhost:8545'));
        console.log('Using new provider');
        window.web3 = web3Obj;
        Session.set('web3ObjReady', true);
      }
    }
  }, 300)

Session.set('web3Interval', web3Interval);
// console.log('package-pre-init done')

if (typeof module !== 'undefined' && module.exports) {
  module.exports = web3Obj;
}

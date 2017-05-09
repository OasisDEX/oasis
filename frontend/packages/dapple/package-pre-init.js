// console.log('package-pre-init start')
import { Session } from 'meteor/session';

web3Obj = new Web3();
Session.set('web3ObjReady', false);
Session.set('web3Counter', 0);

const web3Interval = setInterval(
  function() {
    if (window.web3) {
      web3Obj.setProvider(window.web3.currentProvider);
      console.log('Using current provider');
      initWeb3();
    } else {
      let counter = Session.get('web3Counter');
      counter++;
      Session.set('web3Counter', counter);
      if (counter >= 3) {
        web3Obj.setProvider(new Web3.providers.HttpProvider('http://localhost:8545'));
        console.log('Using new provider');
        initWeb3();
      }
    }
  }, 300
);

function initWeb3() {
  window.web3 = web3Obj;
  clearInterval(Session.get('web3Interval'));
  Session.delete('web3Interval');
  Session.set('web3ObjReady', true);
}

Session.set('web3Interval', web3Interval);
// console.log('package-pre-init done')

if (typeof module !== 'undefined' && module.exports) {
  module.exports = web3Obj;
}

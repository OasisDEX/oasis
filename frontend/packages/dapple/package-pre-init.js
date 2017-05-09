// console.log('package-pre-init start')
web3 = new Web3();

setTimeout(
  function() {
    if (window.web3) {
      web3.setProvider(window.web3.currentProvider);
    } else {
      web3.setProvider(new Web3.providers.HttpProvider('http://localhost:8545'));
    }
    window.web3 = web3;
    Session.set('web3Ready', true);
  }, 500)
// console.log('package-pre-init done')

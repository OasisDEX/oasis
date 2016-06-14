// console.log('package-pre-init start')
if (typeof web3 !== 'undefined') {
  console.log('Reusing web3.currentProvider')
  web3 = new Web3(web3.currentProvider)
} else if (typeof window.web3 !== 'undefined') {
  console.log('Reusing window.web3.currentProvider')
  web3 = new Web3(window.web3.currentProvider)
} else {
  console.log('New Web3.providers.HttpProvider')
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
}
// console.log('package-pre-init done')

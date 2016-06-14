Template.accountSelector.helpers({
  accounts: function () {
    return Session.get('accounts')
  }
})

Template.accountSelector.events({
  'change': function (event, template) {
    Session.set('address', event.target.value)
    localStorage.setItem('address', event.target.value)
    web3.eth.defaultAccount = event.target.value
    Tokens.sync()
  }
})

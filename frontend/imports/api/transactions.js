this.Transactions = new Meteor.Collection(null)

Transactions.add = function (type, transaction_hash, object) {
  console.log('tx', type, transaction_hash, object)
  Transactions.insert({ type: type, tx: transaction_hash, object: object })
}

Transactions.findType = function (type) {
  return Transactions.find({ type: type }).map(function (value) {
    return value.object
  })
}

Transactions.observeRemoved = function (type, callback) {
  return Transactions.find({ type: type }).observe({ removed: callback })
}

Transactions.sync = function () {
  var open = Transactions.find().fetch()

  // Sync all open transactions non-blocking and asynchronously
  var syncTransaction = function (index) {
    if (index >= 0 && index < open.length) {
      var document = open[index]
      web3.eth.getTransactionReceipt(document.tx, function (error, result) {
        if (!error && result != null) {
          if (result.logs.length > 0) {
            console.log('tx_success', document.tx, result.gasUsed)
          } else {
            console.error('tx_oog', document.tx, result.gasUsed)
          }
          Transactions.update({ tx: document.tx }, { $set: { receipt: result } }, function () {
            Transactions.remove({ tx: document.tx })
          })
        }
        // Sync next transaction
        syncTransaction(index + 1)
      })
    }
  }
  syncTransaction(0)
}

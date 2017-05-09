import { Mongo } from 'meteor/mongo';
import { web3Obj } from 'meteor/makerotc:dapple';

class TransactionsCollection extends Mongo.Collection {

  add(type, transactionHash, object) {
    // console.log('tx', type, transactionHash, object);
    super.insert({ type, tx: transactionHash, object });
  }

  findType(type) {
    return super.find({ type }).map(value => value.object);
  }

  observeRemoved(type, callback) {
    return super.find({ type }).observe({ removed: callback });
  }

  sync() {
    const open = super.find().fetch();

    // Sync all open transactions non-blocking and asynchronously
    const syncTransaction = (index) => {
      if (index >= 0 && index < open.length) {
        const document = open[index];
        web3Obj.eth.getTransactionReceipt(document.tx, (error, result) => {
          if (!error && result != null) {
            if (result.logs.length > 0) {
              console.log('tx_success', document.tx, result.gasUsed);
            } else {
              console.error('tx_oog', document.tx, result.gasUsed);
            }
            super.update({ tx: document.tx }, { $set: { receipt: result } }, () => {
              super.remove({ tx: document.tx });
            });
          }
          // Sync next transaction
          syncTransaction(index + 1);
        });
      }
    };
    syncTransaction(0);
  }
}

export default new TransactionsCollection(null);

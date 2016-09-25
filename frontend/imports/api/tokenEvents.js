import { Mongo } from 'meteor/mongo';
import { Session } from 'meteor/session';
import { Dapple, web3 } from 'meteor/makerotc:dapple';
import { _ } from 'meteor/underscore';

class TokenEventCollection extends Mongo.Collection {
  fromLabel() {
    return this.from;
  }
  toLabel() {
    return super.to;
  }
  syncEvent(tokenId, event) {
    if (typeof (event.event) === 'undefined') {
      return;
    }
    let row = {
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: null,
      token: tokenId,
      type: event.event.toLowerCase(),
    };
    // Handle different kinds of contract events
    switch (row.type) {
      case 'transfer':
        row.from = event.args.from;
        row.to = event.args.to;
        row.amount = event.args.value;
        break;
      case 'deposit':
        row.from = event.args.who;
        row.to = event.address;
        row.amount = event.args.amount;
        break;
      case 'withdrawal':
        row.from = event.address;
        row.to = event.args.who;
        row.amount = event.args.amount;
        break;
      default:
        break;
    }
    // Convert amount to string for storage
    if (typeof (row.amount) !== 'undefined') {
      row.amount = row.amount.toString(10);
    }
    super.insert(row);
  }

  syncTimestamps() {
    const open = super.find({ timestamp: null }).fetch();
    // Sync all open transactions non-blocking and asynchronously
    const syncTs = (index) => {
      // console.log('syncing ts', index);
      if (index >= 0 && index < open.length) {
        web3.eth.getBlock(open[index].blockNumber, (error, result) => {
          if (!error) {
            // console.log('update', open[index].blockNumber, result.timestamp);
            super.update({ blockNumber: open[index].blockNumber },
              { $set: { timestamp: result.timestamp } }, { multi: true });
          }
          syncTs(index + 1);
        });
      }
    };
    syncTs(0);
  }

  watchTokenEvents() {
    const ALL_TOKENS = _.uniq([Session.get('quoteCurrency'), Session.get('baseCurrency')]);
    ALL_TOKENS.forEach((tokenId) => {
      Dapple.getToken(tokenId, (error, token) => {
        if (!error) {
          const events = token.allEvents({
            fromBlock: Session.get('startBlock'),
            toBlock: 'latest',
          });
          const self = this;
          events.watch(function watchEvent(error, event) {
            if (!error) {
              self.syncEvent(tokenId, event);
            }
          });
        }
      });
    });
  }

}

export default new TokenEventCollection(null);

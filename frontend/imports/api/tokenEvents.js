import { Mongo } from 'meteor/mongo';
import { Session } from 'meteor/session';
import { Dapple, web3 } from 'meteor/makerotc:dapple';
import { _ } from 'meteor/underscore';

class TokenEventCollection extends Mongo.Collection {

  syncEvent(event) {
    const block = web3.eth.getBlock(event.blockNumber);
    let row = {
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: block.timestamp,
      type: event.event.toLowerCase(),
      amount: event.args.amount,
      to: event.args.who,
      from: event.address,
    };
    switch (row.type) {
      case 'Deposit':
        row.from = event.args.who;
        row.to = event.address;
        break;
      case 'Withdrawal':
        row.from = event.address;
        row.to = event.args.who;
        break;
      default:
        break;
    }
    if (typeof (row.amount) !== 'undefined') {
      row.amount = row.amount.toString(10);
    }
    // console.log(row);
    super.insert(row);
  }

  watchTokenEvents() {
    Dapple.getToken('ETH', (error, token) => {
      if (!error) {
        const events = token.allEvents({ fromBlock: Session.get('startBlock'), toBlock: 'latest' });
        const self = this;
        events.watch(function ethEvent(error, event) {
          if (!error) {
            self.syncEvent(event);
          }
        });
      }
    });
  }

}

export default new TokenEventCollection(null);

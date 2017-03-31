import { Mongo } from 'meteor/mongo';
import { Session } from 'meteor/session';
import { Dapple, web3 } from 'meteor/makerotc:dapple';
import { convertTo18Precision } from '/imports/utils/conversion';

class TokenEventCollection extends Mongo.Collection {
  fromLabel() {
    return this.from;
  }
  toLabel() {
    return super.to;
  }
  getLatestBlock() {
    return new Promise((resolve, reject) => {
      web3.eth.getBlock('latest', (blockError, block) => {
        if (!blockError) {
          resolve(block);
        } else {
          reject(blockError);
        }
      });
    });
  }
  syncEvent(tokenId, event) {
    if (typeof (event.event) === 'undefined') {
      return;
    }
    const row = {
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
        row.amount = convertTo18Precision(event.args.value, Dapple.getTokenByAddress(event.address));
        break;
      case 'deposit':
        row.from = event.args.who;
        row.to = event.address;
        row.amount = convertTo18Precision(event.args.amount, Dapple.getTokenByAddress(event.address));
        break;
      case 'withdrawal':
        row.from = event.address;
        row.to = event.args.who;
        row.amount = convertTo18Precision(event.args.amount, Dapple.getTokenByAddress(event.address));
        break;
      default:
        break;
    }
    // Convert amount to string for storage
    if (typeof (row.amount) !== 'undefined') {
      row.amount = row.amount.toString(10);
    }
    super.upsert({ transactionHash: event.transactionHash, from: row.from, to: row.to }, row, { upsert: true });
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

  watchEvents() {
    if (typeof Session.get('AVGBlocksPerDay') !== 'undefined') {
      const self = this;
      self.getLatestBlock().then((block) => {
        const startingBlock = block.number - (Session.get('AVGBlocksPerDay') * 7);
        console.log(startingBlock);
        self.watchTokenEvents(startingBlock);
        self.watchGNTTokenEvents(startingBlock);
      });
    }
  }

  watchTokenEvents(startingBlock) {
    // console.log('filtering token events from ', Session.get('startBlock'));
    const ALL_TOKENS = Dapple.getTokens();
    ALL_TOKENS.forEach((tokenId) => {
      Dapple.getToken(tokenId, (error, token) => {
        if (!error) {
          const events = token.allEvents({
            fromBlock: startingBlock,
            toBlock: 'latest',
          });
          const self = this;
          events.watch((err, event) => {
            if (!err) {
              self.syncEvent(tokenId, event);
            }
          });
        }
      });
    });
  }

  watchGNTTokenEvents(startingBlock) {
    Dapple.getToken('GNT', (errorGNT, GNT) => {
      if (!errorGNT) {
        Dapple.getToken('W-GNT', (errorWGNT, WGNT) => {
          if (!errorWGNT) {
            WGNT.getBroker.call((errorBroker, broker) => {
              if (!errorBroker && broker !== '0x0000000000000000000000000000000000000000') {
                /* eslint-disable new-cap */
                GNT.Transfer({ from: broker, to: WGNT.address },
                  { fromBlock: startingBlock }, (errorDeposit, eventDeposit) => {
                    if (!errorDeposit) {
                      const row = {
                        blockNumber: eventDeposit.blockNumber,
                        transactionHash: eventDeposit.transactionHash,
                        timestamp: null,
                        token: Dapple.getTokenByAddress(WGNT.address),
                        type: 'deposit',
                        from: Session.get('address'),
                        to: WGNT.address,
                        amount: eventDeposit.args.value.toNumber(),
                      };
                      super.upsert({ transactionHash: eventDeposit.transactionHash }, row, { upsert: true });
                    }
                  });

                GNT.Transfer({ from: WGNT.address, to: Session.get('address') },
                  { fromBlock: startingBlock }, (ErrorWithdrawal, eventWithdrawal) => {
                    if (!ErrorWithdrawal) {
                      const row = {
                        blockNumber: eventWithdrawal.blockNumber,
                        transactionHash: eventWithdrawal.transactionHash,
                        timestamp: null,
                        token: Dapple.getTokenByAddress(WGNT.address),
                        type: 'withdrawal',
                        from: WGNT.address,
                        to: Session.get('address'),
                        amount: eventWithdrawal.args.value.toNumber(),
                      };
                      super.upsert({ transactionHash: eventWithdrawal.transactionHash }, row, { upsert: true });
                    }
                  });
                /* eslint-enable new-cap */
              }
            });
          }
        });
      }
    });
  }
}

export default new TokenEventCollection(null);

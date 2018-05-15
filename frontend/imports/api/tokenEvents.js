import { Mongo } from 'meteor/mongo';
import { Session } from 'meteor/session';
import { Dapple, web3Obj } from 'meteor/makerotc:dapple';
import { convertTo18Precision } from '/imports/utils/conversion';

class TokenEventCollection extends Mongo.Collection {
  fromLabel() {
    return this.from;
  }

  toLabel() {
    return super.to;
  }

  setEventLoadingIndicatorStatus(txhash, status) {
    const currentlyLoading = Session.get('loadingTokenEvents') || {};
    currentlyLoading[txhash] = status;
    Session.set('loadingTokenEvents', currentlyLoading);
  }

  getLatestBlock() {
    return new Promise((resolve, reject) => {
      web3Obj.eth.getBlock('latest', (blockError, block) => {
        if (!blockError) {
          resolve(block);
        } else {
          reject(blockError);
        }
      });
    });
  }

  prepareRow(tokenId, event) {
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

    return row;
  }

  syncEvent(tokenId, event) {
    const row = this.prepareRow(tokenId, event);
    super.insert(row);
  }

  syncEvents(tokenId, events) {
    const rows = [];
    for (let i = 0; i < events.length; i++) {
      rows[i] = this.prepareRow(tokenId, events[i]);
    }
    super.batchInsert(rows, () => {});
  }

  syncTimestamps() {
    const open = super.find({ timestamp: null }).fetch();
    // Sync all open transactions non-blocking and asynchronously
    const syncTs = (index) => {
      // console.log('syncing ts', index);
      if (index >= 0 && index < open.length) {
        web3Obj.eth.getBlock(open[index].blockNumber, (error, result) => {
          if (!error) {
            // console.log('update', open[index].blockNumber, result.timestamp);
            super.update({ blockNumber: open[index].blockNumber },
              { $set: { timestamp: result.timestamp } }, { multi: true });
            this.setEventLoadingIndicatorStatus(open[index].transactionHash, false);
          }
          syncTs(index + 1);
        });
      }
    };
    syncTs(0);
  }

  watchEvents() {
    if (Session.get('AVGBlocksPerDay') && !Session.get('watchedEvents')) {
      Session.set('watchedEvents', true);
      const self = this;
      self.getLatestBlock().then((block) => {
        self.watchTokenEvents(block.number);
        self.watchGNTTokenEvents(block.number);
      });
    }
  }

  /* eslint new-cap: ["error", { "capIsNewExceptions": ["Transfer", "Deposit", "Withdrawal"] }] */

  watchTokenEvents(latestBlock) {
    // console.log('filtering token events from ', Session.get('startBlock'));
    const ALL_TOKENS = Dapple.getTokens();
    ALL_TOKENS.forEach((tokenId) => {
      Dapple.getToken(tokenId, (error, token) => {
        // console.log(tokenId);
        if (!error) {
          const address = Session.get('address');
          const self = this;
          // TODO: extract duplicated logic for every event in separate abstraction layer
          token.Transfer({ from: address }, {
            fromBlock: latestBlock - (Session.get('AVGBlocksPerDay') * 7), // Last 7 days
          }).get((err, result) => {
            if (!err) {
              self.syncEvents(tokenId, result);
              result.forEach((transferEvent) => {
                this.setEventLoadingIndicatorStatus(transferEvent.transactionHash, true);
              });
              Session.set('loadingTransferHistory', false);
            }
            token.Transfer({ from: address }, { fromBlock: 'latest' }, (err2, result2) => {
              if (!err2) {
                this.setEventLoadingIndicatorStatus(result2.transactionHash, true);
                self.syncEvent(tokenId, result2);
              }
            });
          });

          token.Transfer({ to: address }, {
            fromBlock: latestBlock - (Session.get('AVGBlocksPerDay') * 7), // Last 7 days
          }).get((err, result) => {
            if (!err) {
              self.syncEvents(tokenId, result);
              result.forEach((transferEvent) => {
                this.setEventLoadingIndicatorStatus(transferEvent.transactionHash, true);
              });
              Session.set('loadingTransferHistory', false);
            }
            token.Transfer({ to: address }, { fromBlock: 'latest' }, (err2, result2) => {
              if (!err2) {
                this.setEventLoadingIndicatorStatus(result2.transactionHash, true);
                self.syncEvent(tokenId, result2);
              }
            });
          });
          if (tokenId === 'W-ETH') {
            token.Deposit({who: address}, {
              fromBlock: latestBlock - (Session.get('AVGBlocksPerDay') * 7), // Last 7 days
            }).get((err, result) => {
              if (!err) {
                self.syncEvents(tokenId, result);
                result.forEach((depositEvent) => {
                  this.setEventLoadingIndicatorStatus(depositEvent.transactionHash, true);
                });
                Session.set('loadingWrapHistory', false);
              }
              token.Deposit({who: address}, { fromBlock: 'latest' }, (err2, result2) => {
                if (!err2) {
                  this.setEventLoadingIndicatorStatus(result2.transactionHash, true);
                  self.syncEvent(tokenId, result2);
                }
              });
            });
            token.Withdrawal({who: address}, {
              fromBlock: latestBlock - (Session.get('AVGBlocksPerDay') * 7), // Last 7 days
            }).get((err, result) => {
              if (!err) {
                self.syncEvents(tokenId, result);
                result.forEach((withdrawEvent) => {
                  this.setEventLoadingIndicatorStatus(withdrawEvent.transactionHash, true);
                });
                Session.set('loadingWrapHistory', false);
              }
              token.Withdrawal({who: address}, { fromBlock: 'latest' }, (err2, result2) => {
                if (!err2) {
                  this.setEventLoadingIndicatorStatus(result2.transactionHash, true);
                  self.syncEvent(tokenId, result2);
                }
              });
            });
          }
        }
      });
    });
  }

  prepareRowGNT(event, token, type, to) {
    const row = {
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: null,
      token,
      type,
      from: Session.get('address'),
      to,
      amount: event.args.value.toNumber(),
    };

    return row;
  }

  watchGNTTokenEvents(latestBlock) {
    const self = this;
    Dapple.getToken('GNT', (errorGNT, GNT) => {
      if (!errorGNT) {
        Dapple.getToken('W-GNT', (errorWGNT, WGNT) => {
          if (!errorWGNT) {
            WGNT.getBroker.call((errorBroker, broker) => {
              if (!errorBroker && broker !== '0x0000000000000000000000000000000000000000') {
                GNT.Transfer({ from: broker, to: WGNT.address }, {
                  fromBlock: latestBlock - (Session.get('AVGBlocksPerDay') * 7), // Last 7 days
                }).get((error, result) => {
                  if (!error) {
                    const rows = [];
                    for (let i = 0; i < result.length; i++) {
                      rows[i] = self.prepareRowGNT(result[i],
                                                  Dapple.getTokenByAddress(WGNT.address),
                                                  'deposit',
                                                  WGNT.address);
                      this.setEventLoadingIndicatorStatus(result[i].transactionHash, true);
                    }
                    super.batchInsert(rows, () => {});
                    Session.set('loadingWrapHistory', false);
                  }
                  GNT.Transfer({ from: broker, to: WGNT.address },
                  { fromBlock: 'latest' }, (error2, result2) => {
                    if (!error2) {
                      const row = self.prepareRowGNT(result2,
                                                    Dapple.getTokenByAddress(WGNT.address),
                                                    'deposit',
                                                    WGNT.address);
                      this.setEventLoadingIndicatorStatus(result2.transactionHash, true);
                      super.insert(row);
                    }
                  });
                });

                GNT.Transfer({ from: WGNT.address, to: Session.get('address') }, {
                  fromBlock: latestBlock - (Session.get('AVGBlocksPerDay') * 7), // Last 7 days
                }).get((error, result) => {
                  if (!error) {
                    const rows = [];
                    for (let i = 0; i < result.length; i++) {
                      rows[i] = self.prepareRowGNT(result[i],
                                                  Dapple.getTokenByAddress(WGNT.address),
                                                  'withdrawal',
                                                  Session.get('address'));
                      this.setEventLoadingIndicatorStatus(result[i].transactionHash, true);
                    }
                    super.batchInsert(rows, () => {});
                    Session.set('loadingWrapHistory', false);
                  }
                  GNT.Transfer({ from: WGNT.address, to: Session.get('address') },
                  { fromBlock: 'latest' }, (error2, result2) => {
                    if (!error2) {
                      const row = self.prepareRowGNT(result2,
                                                    Dapple.getTokenByAddress(WGNT.address),
                                                    'withdrawal',
                                                    Session.get('address'));
                      this.setEventLoadingIndicatorStatus(result2.transactionHash, true);
                      super.insert(row);
                    }
                  });
                });
              }
            });
          }
        });
      }
    });
  }
}

export default new TokenEventCollection(null);

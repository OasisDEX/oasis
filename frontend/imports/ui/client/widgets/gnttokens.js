import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { BigNumber } from 'meteor/ethereum:web3';
import { web3 } from 'meteor/makerotc:dapple';

import Transactions from '/imports/api/transactions';
import Tokens from '/imports/api/tokens';
import TokenEvents from '/imports/api/tokenEvents';
import { prettyError } from '/imports/utils/prettyError';

import './gnttokens.html';

const TRANSACTION_TYPE_WITHDRAW = 'gnttokens_withdraw';
const DEPOSIT_GAS = 150000;
const WITHDRAW_GAS = 150000;
const DEPOSIT = 'deposit';
const WITHDRAW = 'withdraw';

Template.gnttokens.viewmodel({
  type() {
    const depositType = (this !== null && this !== undefined) ? this.depositType() : '';
    return depositType;
  },
  amount: '',
  lastError: '',
  pending() {
    return Transactions.findType(TRANSACTION_TYPE_WITHDRAW);
  },
  progress() {
    return Session.get('GNTDepositProgress');
  },
  progressMessage() {
    return Session.get('GNTDepositProgressMessage');
  },
  maxAmount() {
    let maxAmount = '0';
    try {
      if (this.type() === DEPOSIT) {
        maxAmount = web3.fromWei(Session.get('GNTBalance'));
      } else if (this.type() === WITHDRAW) {
        maxAmount = web3.fromWei(Tokens.findOne('W-GNT').balance);
      }
    } catch (e) {
      maxAmount = '0';
    }
    return maxAmount;
  },
  canDeposit() {
    try {
      const amount = new BigNumber(this.amount());
      const maxAmount = new BigNumber(this.maxAmount());
      return amount.gt(0) && amount.lte(maxAmount);
    } catch (e) {
      return false;
    }
  },
  deposit(event) {
    event.preventDefault();
    this.lastError('');

    if (this.type() === DEPOSIT) {
      // XXX EIP20
      Dapple.getToken('W-GNT', (error, token) => {
        if (!error) {
          token.getBroker.call((e, broker) => {
            if (!e) {
              // Check value of broker
              if (broker !== '0x0000000000000000000000000000000000000000') {
                const tx = Session.get('address') + Date.now();
                Transactions.insert({
                  type: 'gnttokens_create_broker',
                  tx,
                  object: {
                    type: DEPOSIT,
                    amount: this.amount(),
                  },
                  receipt: {
                    logs: [{ topics: ['', broker] }],
                  },
                });
                Transactions.remove({ tx });
              } else {
                // Create broker
                token.createBroker((txError, tx) => {
                  if (!txError) {
                    console.log('TX Create Broker:', tx);
                    Session.set('GNTDepositProgress', 25);
                    Session.set('GNTDepositProgressMessage', 'Creating Broker...');
                    Transactions.add('gnttokens_create_broker', tx, { type: DEPOSIT, amount: this.amount() });
                  } else {
                    this.lastError(prettyError(txError));
                  }
                });
              }
            }
          });
        } else {
          this.lastError(error.toString());
        }
      });
    } else {
      // XXX EIP20
      Dapple.getToken('W-GNT', (error, token) => {
        if (!error) {
          token.withdraw(web3.toWei(this.amount()), { gas: WITHDRAW_GAS }, (txError, tx) => {
            if (!txError) {
              console.log('add transaction withdraw');
              Transactions.add(TRANSACTION_TYPE_WITHDRAW, tx, { type: WITHDRAW, amount: this.amount() });
            } else {
              this.lastError(prettyError(txError));
            }
          });
        } else {
          this.lastError(error.toString());
        }
      });
    }
  },
});

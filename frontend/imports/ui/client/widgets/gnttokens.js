import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { BigNumber } from 'meteor/ethereum:web3';
import { web3 } from 'meteor/makerotc:dapple';

import Transactions from '/imports/api/transactions';
import Tokens from '/imports/api/tokens';
import { uppercaseFirstLetter, formatError } from '/imports/utils/functions';

import './gnttokens.html';

const TRANSACTION_TYPE_WITHDRAW = 'gnttokens_withdraw';
const WITHDRAW_GAS = 150000;
const CLEAR_BROKER_GAS = 150000;
const DEPOSIT = 'deposit';
const WITHDRAW = 'withdraw';

Template.gnttokens.viewmodel({
  type() {
    const depositType = (this !== null && this !== undefined) ? this.depositType() : '';
    return depositType;
  },
  amount: '',
  lastError: '',
  broker() {
    return Session.get('GNTBroker');
  },
  brokerBalance() {
    const balance = Session.get('GNTBrokerBalance');
    if (balance !== '0') {
      return balance;
    }
    return 0;
  },
  clearBroker(event) {
    event.preventDefault();
    Dapple['token-wrapper'].classes.DepositBroker.at(this.broker()).clear({ gas: CLEAR_BROKER_GAS }, (txError, tx) => {
      if (!txError) {
        Session.set('GNTDepositProgress', 90);
        Session.set('GNTDepositProgressMessage', 'Clearing Broker... (waiting for transaction confirmation)');
        Session.set('GNTDepositErrorMessage', '');
        Transactions.add('gnttokens_clear', tx, { type: 'deposit' });
      } else {
        Session.set('GNTDepositProgress', 0);
        Session.set('GNTDepositProgressMessage', '');
        Session.set('GNTDepositErrorMessage', formatError(txError));
      }
    });
  },
  progress() {
    return Session.get(`GNT${uppercaseFirstLetter(this.type())}Progress`);
  },
  progressMessage() {
    return Session.get(`GNT${uppercaseFirstLetter(this.type())}ProgressMessage`);
  },
  errorMessage() {
    return Session.get(`GNT${uppercaseFirstLetter(this.type())}ErrorMessage`);
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
          Session.set('GNTDepositProgress', 10);
          Session.set('GNTDepositProgressMessage', 'Checking if Broker already exists...');
          Session.set('GNTDepositErrorMessage', '');
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
                Session.set('GNTDepositProgress', 20);
                Session.set('GNTDepositProgressMessage', 'Creating Broker... (waiting for your approval)');
                token.createBroker((txError, tx) => {
                  if (!txError) {
                    Session.set('GNTDepositProgress', 30);
                    Session.set('GNTDepositProgressMessage',
                      'Creating Broker... (waiting for transaction confirmation)');
                    Transactions.add('gnttokens_create_broker', tx, { type: DEPOSIT, amount: this.amount() });
                  } else {
                    Session.set('GNTDepositProgress', 0);
                    Session.set('GNTDepositProgressMessage', '');
                    Session.set('GNTDepositErrorMessage', formatError(txError));
                  }
                });
              }
            }
          });
        } else {
          Session.set('GNTDepositProgress', 0);
          Session.set('GNTDepositProgressMessage', '');
          Session.set('GNTDepositErrorMessage', error.toString());
        }
      });
    } else {
      // XXX EIP20
      Dapple.getToken('W-GNT', (error, token) => {
        if (!error) {
          Session.set('GNTWithdrawProgress', 33);
          Session.set('GNTWithdrawProgressMessage', 'Starting withdraw... (waiting for your approval)');
          Session.set('GNTWithdrawErrorMessage', '');
          token.withdraw(web3.toWei(this.amount()), { gas: WITHDRAW_GAS }, (txError, tx) => {
            if (!txError) {
              Session.set('GNTWithdrawProgress', 66);
              Session.set('GNTWithdrawProgressMessage', 'Executing withdraw... (waiting for transaction confirmation)');
              Transactions.add(TRANSACTION_TYPE_WITHDRAW, tx, { type: WITHDRAW, amount: this.amount() });
            } else {
              Session.set('GNTWithdrawProgress', 0);
              Session.set('GNTWithdrawProgressMessage', '');
              Session.set('GNTWithdrawErrorMessage', formatError(txError));
            }
          });
        } else {
          Session.set('GNTWithdrawProgress', 0);
          Session.set('GNTWithdrawProgressMessage', '');
          Session.set('GNTWithdrawErrorMessage', error.toString());
        }
      });
    }
  },
});

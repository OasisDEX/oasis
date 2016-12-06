import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { BigNumber } from 'meteor/ethereum:web3';
import { web3 } from 'meteor/makerotc:dapple';

import Transactions from '/imports/api/transactions';
import Tokens from '/imports/api/tokens';
import { uppercaseFirstLetter, formatError } from '/imports/utils/functions';

import './ethtokens.html';

const TRANSACTION_TYPE_WITHDRAW = 'ethtokens_withdraw';
const TRANSACTION_TYPE_DEPOSIT = 'ethtokens_deposit';
const DEPOSIT_GAS = 150000;
const WITHDRAW_GAS = 150000;
const DEPOSIT = 'deposit';
const WITHDRAW = 'withdraw';

Template.ethtokens.viewmodel({
  type() {
    const depositType = (this !== null && this !== undefined) ? this.depositType() : '';
    return depositType;
  },
  amount: '',
  lastError: '',
  progress() {
    return Session.get(`ETH${uppercaseFirstLetter(this.type())}Progress`);
  },
  progressMessage() {
    return Session.get(`ETH${uppercaseFirstLetter(this.type())}ProgressMessage`);
  },
  errorMessage() {
    return Session.get(`ETH${uppercaseFirstLetter(this.type())}ErrorMessage`);
  },
  maxAmount() {
    let maxAmount = '0';
    try {
      if (this.type() === DEPOSIT) {
        maxAmount = web3.fromWei(Session.get('ETHBalance'));
      } else if (this.type() === WITHDRAW) {
        maxAmount = web3.fromWei(Tokens.findOne('W-ETH').balance);
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
      const options = {
        gas: DEPOSIT_GAS,
        value: web3.toWei(this.amount()),
      };
      // XXX EIP20
      Dapple.getToken('W-ETH', (error, token) => {
        if (!error) {
          Session.set('ETHDepositProgress', 33);
          Session.set('ETHDepositProgressMessage', 'Starting deposit... (waiting for your approval)');
          Session.set('ETHDepositErrorMessage', '');
          token.deposit(options, (txError, tx) => {
            if (!txError) {
              Session.set('ETHDepositProgress', 66);
              Session.set('ETHDepositProgressMessage', 'Executing deposit... (waiting for transaction confirmation)');
              Session.set('ETHDepositErrorMessage', '');
              Transactions.add(TRANSACTION_TYPE_DEPOSIT, tx, { type: DEPOSIT, amount: this.amount() });
            } else {
              Session.set('ETHDepositProgress', 0);
              Session.set('ETHDepositProgressMessage', '');
              Session.set('ETHDepositErrorMessage', formatError(txError));
            }
          });
        } else {
          Session.set('ETHDepositProgress', 0);
          Session.set('ETHDepositProgressMessage', '');
          Session.set('ETHDepositErrorMessage', error.toString());
        }
      });
    } else {
      // XXX EIP20
      Dapple.getToken('W-ETH', (error, token) => {
        if (!error) {
          Session.set('ETHWithdrawProgress', 33);
          Session.set('ETHWithdrawProgressMessage', 'Starting withdraw... (waiting for your approval)');
          Session.set('ETHWithdrawErrorMessage', '');
          token.withdraw(web3.toWei(this.amount()), { gas: WITHDRAW_GAS }, (txError, tx) => {
            if (!txError) {
              Session.set('ETHWithdrawProgress', 66);
              Session.set('ETHWithdrawProgressMessage', 'Executing withdraw... (waiting for transaction confirmation)');
              Transactions.add(TRANSACTION_TYPE_WITHDRAW, tx, { type: WITHDRAW, amount: this.amount() });
            } else {
              Session.set('ETHWithdrawProgress', 0);
              Session.set('ETHWithdrawProgressMessage', '');
              Session.set('ETHWithdrawErrorMessage', formatError(txError));
            }
          });
        } else {
          Session.set('ETHWithdrawProgress', 0);
          Session.set('ETHWithdrawProgressMessage', '');
          Session.set('ETHWithdrawErrorMessage', error.toString());
        }
      });
    }
  },
});

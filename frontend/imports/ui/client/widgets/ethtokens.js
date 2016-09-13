import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { BigNumber } from 'meteor/ethereum:web3';
import { web3 } from 'meteor/makerotc:dapple';

import Transactions from '/imports/api/transactions';
import Tokens from '/imports/api/tokens';

import './ethtokens.html';

const TRANSACTION_TYPE = 'ethtokens';
const DEPOSIT_GAS = 150000;
const WITHDRAW_GAS = 150000;

Template.ethtokens.viewmodel({
  type: 'deposit',
  amount: '',
  lastError: '',
  pending() {
    return Transactions.findType(TRANSACTION_TYPE);
  },
  maxAmount() {
    let maxAmount = '0';
    try {
      if (this.type() === 'deposit') {
        maxAmount = web3.fromWei(Session.get('ETHBalance'));
      } else if (this.type() === 'withdraw') {
        maxAmount = web3.fromWei(Tokens.findOne('ETH').balance);
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

    if (this.type() === 'deposit') {
      const options = {
        gas: DEPOSIT_GAS,
        value: web3.toWei(this.amount()),
      };
      // XXX EIP20
      Dapple.getToken('ETH', (error, token) => {
        if (!error) {
          token.deposit(options, (txError, tx) => {
            if (!txError) {
              Transactions.add(TRANSACTION_TYPE, tx, { type: 'deposit', amount: this.amount() });
            } else {
              this.lastError(Template.prettyError(txError));
            }
          });
        } else {
          this.lastError(error.toString());
        }
      });
    } else {
      // XXX EIP20
      Dapple.getToken('ETH', (error, token) => {
        if (!error) {
          token.withdraw(web3.toWei(this.amount()), { gas: WITHDRAW_GAS }, (txError, tx) => {
            if (!txError) {
              Transactions.add(TRANSACTION_TYPE, tx, { type: 'withdraw', amount: this.amount() });
            } else {
              this.lastError(Template.prettyError(txError));
            }
          });
        } else {
          this.lastError(error.toString());
        }
      });
    }
  },
});

import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { BigNumber } from 'meteor/ethereum:web3';
import { web3 } from 'meteor/makerotc:dapple';

import Transactions from '/imports/api/transactions';
import Tokens from '/imports/api/tokens';
import TokenEvents from '/imports/api/tokenEvents';
import { prettyError } from '/imports/utils/prettyError';

import './ethtokens.html';

const TRANSACTION_TYPE = 'ethtokens';
const DEPOSIT_GAS = 150000;
const WITHDRAW_GAS = 150000;

Template.ethtokens.viewmodel({
  type() {
    const depositType = Template.instance() !== null ? Template.instance().data.depositType : '';
    return depositType;
  },
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
      console.log('amount:', amount, ' maxAmount:', maxAmount);
      return amount.gt(0) && amount.lte(maxAmount);
    } catch (e) {
      console.log('error', e);
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
              console.log('add transaction deposit');
              Transactions.add(TRANSACTION_TYPE, tx, { type: 'deposit', amount: this.amount() });
            } else {
              this.lastError(prettyError(txError));
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
              console.log('add transaction withdraw');
              Transactions.add(TRANSACTION_TYPE, tx, { type: 'withdraw', amount: this.amount() });
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

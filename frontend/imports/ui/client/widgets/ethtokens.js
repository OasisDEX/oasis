import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { BigNumber } from 'meteor/ethereum:web3';
import { web3Obj } from 'meteor/makerotc:dapple';

import Transactions from '/imports/api/transactions';
import Tokens from '/imports/api/tokens';
import WETH from '/imports/api/weth';
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
  shouldShowMaxBtn: false,
  shouldShowWrapWarning: false,
  fillAmount() {
    let amount = '0';
    try {
      if (this.type() === DEPOSIT) {
        amount = web3Obj.fromWei(Session.get('ETHBalance'));
      } else if (this.type() === WITHDRAW) {
        amount = web3Obj.fromWei(Tokens.findOne('W-ETH').balance);
      }
    } catch (e) {
      amount = '0';
    }
    this.amount(amount);
  },
  onFocus() {
    if (this.title().toLowerCase() === 'unwrap') { this.shouldShowMaxBtn(true); }
    if (this.title().toLowerCase() === 'wrap') { this.shouldShowWrapWarning(true); }
  },
  onBlur() {
    if (this.title().toLowerCase() === 'unwrap') { this.shouldShowMaxBtn(false); }
    if (this.title().toLowerCase() === 'wrap') { this.shouldShowWrapWarning(false); }
  },
  focusOnInput(event) {
    $(event.target).find('input.with-max-btn').focus();
  },
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
        maxAmount = web3Obj.fromWei(Session.get('ETHBalance'));
      } else if (this.type() === WITHDRAW) {
        maxAmount = web3Obj.fromWei(Tokens.findOne('W-ETH').balance);
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
        value: web3Obj.toWei(this.amount()),
      };
      // XXX EIP20
      Dapple.getToken('W-ETH', (error, token) => {
        if (!error) {
          Session.set('ETHDepositProgress', 33);
          Session.set('ETHDepositProgressMessage', 'Starting wrap... (waiting for your approval)');
          Session.set('ETHDepositErrorMessage', '');
          token.deposit(options, (txError, tx) => {
            if (!txError) {
              Session.set('ETHDepositProgress', 66);
              Session.set('ETHDepositProgressMessage', 'Executing wrap... (waiting for transaction confirmation)');
              Session.set('ETHDepositErrorMessage', '');
              Transactions.add(TRANSACTION_TYPE_DEPOSIT, tx, { type: DEPOSIT, amount: this.amount() });
            } else {
              Session.set('ETHDepositProgress', 0);
              Session.set('ETHDepositProgressMessage', '');
              Session.set('ETHDepositErrorMessage', formatError(txError));
            }
          });
          WETH.watchDeposit();
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
          Session.set('ETHWithdrawProgressMessage', 'Starting unwrap... (waiting for your approval)');
          Session.set('ETHWithdrawErrorMessage', '');
          token.withdraw(web3Obj.toWei(this.amount()), { gas: WITHDRAW_GAS }, (txError, tx) => {
            if (!txError) {
              Session.set('ETHWithdrawProgress', 66);
              Session.set('ETHWithdrawProgressMessage', 'Executing unwrap... (waiting for transaction confirmation)');
              Transactions.add(TRANSACTION_TYPE_WITHDRAW, tx, { type: WITHDRAW, amount: this.amount() });
            } else {
              Session.set('ETHWithdrawProgress', 0);
              Session.set('ETHWithdrawProgressMessage', '');
              Session.set('ETHWithdrawErrorMessage', formatError(txError));
            }
          });
          WETH.watchWithdraw();
        } else {
          Session.set('ETHWithdrawProgress', 0);
          Session.set('ETHWithdrawProgressMessage', '');
          Session.set('ETHWithdrawErrorMessage', error.toString());
        }
      });
    }
  },
});

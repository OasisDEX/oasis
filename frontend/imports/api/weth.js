import { Session } from 'meteor/session';
import Transactions from './transactions';

class WETH {
  watchDeposit() {
    Transactions.observeRemoved('ethtokens_deposit', (document) => {
      if (document.receipt.logs.length === 0) {
        Session.set('ETHDepositProgress', 0);
        Session.set('ETHDepositProgressMessage', '');
        Session.set('ETHDepositErrorMessage', 'Deposit went wrong. Please execute the deposit again.');
      } else {
        Session.set('ETHDepositProgress', 100);
        Session.set('ETHDepositProgressMessage', 'Deposit Done!');
        Meteor.setTimeout(() => {
          Session.set('ETHDepositProgress', 0);
          Session.set('ETHDepositProgressMessage', '');
        }, 10000);
      }
    });
  }

  watchWithdraw() {
    Transactions.observeRemoved('ethtokens_withdraw', (document) => {
      if (document.receipt.logs.length === 0) {
        Session.set('ETHWithdrawProgress', 0);
        Session.set('ETHWithdrawProgressMessage', '');
        Session.set('ETHWithdrawErrorMessage', 'Withdrawing went wrong. Please execute the withdraw again.');
      } else {
        Session.set('ETHWithdrawProgress', 100);
        Session.set('ETHWithdrawProgressMessage', 'Withdraw Done!');
        Meteor.setTimeout(() => {
          Session.set('ETHWithdrawProgress', 0);
          Session.set('ETHWithdrawProgressMessage', '');
        }, 10000);
      }
    });
  }
}

export default new WETH();

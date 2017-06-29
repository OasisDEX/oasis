import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { web3Obj } from 'meteor/makerotc:dapple';

import Transactions from '/imports/api/transactions';
import { formatError } from '/imports/utils/functions';
import './wrapper-update.html';

const TRANSACTION_TYPE_WITHDRAW = 'ethtokens_withdraw';
const WITHDRAW_GAS = 150000;
const WITHDRAW = 'withdraw';

Template.wrapperUpdate.viewmodel({
  unwrap() {
    const amount = Session.get('oldWrapperBalance');
    Dapple.getToken('OW-ETH', (error, token) => {
      if (!error) {
        Session.set('ETHWithdrawProgress', 33);
        Session.set('ETHWithdrawProgressMessage', 'Starting unwrap... (waiting for your approval)');
        Session.set('ETHWithdrawErrorMessage', '');
        token.withdraw(amount.toString(10), { gas: WITHDRAW_GAS }, (txError, tx) => {
          if (!txError) {
            Session.set('ETHWithdrawProgress', 66);
            Session.set('ETHWithdrawProgressMessage', 'Executing unwrap... (waiting for transaction confirmation)');
            Transactions.add(TRANSACTION_TYPE_WITHDRAW, tx, { type: WITHDRAW, amount: amount.toString(10) });
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
  },
});


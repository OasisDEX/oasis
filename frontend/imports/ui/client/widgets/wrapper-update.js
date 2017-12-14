import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { web3Obj } from 'meteor/makerotc:dapple';

import Transactions from '/imports/api/transactions';
import { formatError } from '/imports/utils/functions';
import './progress-bar.js';
import './wrapper-update.html';

const TRANSACTION_TYPE_WITHDRAW = 'ethtokens_withdraw';
const WITHDRAW_GAS = 150000;
const WITHDRAW = 'withdraw';

Template.wrapperUpdate.viewmodel({
  message: '',
  current: 0,
  inProgress: false,

  resetProgressBar() {
    this.current(0);
    this.message('');
    this.inProgress(false);
  },
  onInterruptedWrapping(error) {
    this.resetProgressBar();
    this.message('Unwrapping interrupted! Please try again!');
    console.debug('Received error during unwrapping: ', error);
  },
  unwrap() {
    const amount = Session.get('oldWrapperBalance');
    this.inProgress(true);
    Dapple.getToken('OW-ETH', (error, token) => {
      if (!error) {
        this.current(33);
        this.message('Start unwrapping ...');
        token.withdraw(amount.toString(10), { gas: WITHDRAW_GAS }, (txError, tx) => {
          if (!txError) {
            this.current(66);
            this.message('Unwrapping... (waiting for transaction confirmation)');
            const txChecking = setInterval(() => {
              web3Obj.eth.getTransactionReceipt(tx, (err, result) => {
                if (!err) {
                  if (result) {
                    console.log('Receipt status :', result.status);
                    if (result.status === '0x1') {
                      this.current(100);
                      this.message('Unwrapping Done!');
                    } else {
                      this.onInterruptedWrapping('Missing logs inside the receipt!');
                    }

                    clearInterval(txChecking);

                    setTimeout(() => {
                      this.inProgress(false);
                      /**
                       * Nasty workaround because $('#wrapperUpdate').modal('hide') not working on surge.
                       * Even invoked within dev console it's still  not closing the modal.
                       * @type {*}
                       */
                      const modal = $('#wrapperUpdate');
                      modal.removeClass('in');
                      modal.css('display', 'none');

                      const body = $('body');
                      body.removeClass('modal-open');
                      body.css('padding-right', '0');
                    }, 1000);
                  }
                } else {
                  this.onInterruptedWrapping(txError);
                }
              });
            }, 1000);
          } else {
            this.onInterruptedWrapping(txError);
          }
        });
      } else {
        this.onInterruptedWrapping(error);
      }
    });
  },
});


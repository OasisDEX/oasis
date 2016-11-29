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
const TRANSACTION_TYPE_DEPOSIT = 'gnttokens_deposit';
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
    if (this.type() === DEPOSIT) {
      return Transactions.findType(TRANSACTION_TYPE_DEPOSIT);
    }
    return Transactions.findType(TRANSACTION_TYPE_WITHDRAW);
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
      const options = {
        gas: DEPOSIT_GAS,
      };
      // XXX EIP20
      Dapple.getToken('W-GNT', (error, token) => {
        if (!error) {
          // Create broker
          token.createBroker((txError, tx) => {
            if (!txError) {
              web3.eth.getTransactionReceipt(tx, (e, result) => {
                if (!e && result != null) {
                  if (result.logs.length > 0) {
                    const broker = result.logs[0].topics[1];
                    console.log("Broker result: ", result);
                    // We get the broker, we transfer GNT to it
                    Dapple.getToken('GNT', (err, gntToken) => {
                      gntToken.transfer(broker, web3.toWei(this.amount()), (transferError, res) => {
                        console.log('Transfer: ', res);
                        Dapple['token-wrapper'].classes['DepositBroker'].at(broker).clear((clearError, clearResult) => console.log(clearResult));
                      });
                    });
                  } else {
                    //Session.set('newTransactionMessage', { message: 'Transaction failed' + tx, type: 'danger' });
                    console.error('tx_oog', tx, result.gasUsed);
                  }
                } else {
                  console.log('transaction receipt', e, result);
                  //Session.set('newTransactionMessage', { message: 'Transation successful' + document.tx, type: 'success' });
                }
              });
            } else {
              this.lastError(prettyError(txError));
            }
          });
          // token.deposit(options, (txError, tx) => {
          //   if (!txError) {
          //     console.log('add transaction deposit');
          //     Transactions.add(TRANSACTION_TYPE_DEPOSIT, tx, { type: DEPOSIT, amount: this.amount() });
          //   } else {
          //     this.lastError(prettyError(txError));
          //   }
          // });
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

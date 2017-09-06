import { Template } from 'meteor/templating';
import { BigNumber } from 'meteor/ethereum:web3';
import { Dapple, web3Obj } from 'meteor/makerotc:dapple';

import Transactions from '/imports/api/transactions';
import Tokens from '/imports/api/tokens';
import { formatError } from '/imports/utils/functions';

import { convertToTokenPrecision } from '/imports/utils/conversion';

import './transferconfirmation';
import './sendtokens.html';

const TRANSFER_GAS = 150000;
const TRANSACTION_TYPE = 'transfer';

Template.sendtokens.viewmodel({
  currency: 'MKR',
  currencies: Dapple.getTokens(),
  recipient: '',
  lastError: '',
  amount: '',
  validAmount: true,
  shouldShowMaxBtn: false,
  onFocus() {
    this.shouldShowMaxBtn(true);
  },
  onBlur() {
    this.shouldShowMaxBtn(false);
  },
  focusOnInput(event) {
    $(event.target).find('input.with-max-btn').focus();
  },
  precision() {
    return Dapple.getTokenSpecs(this.currency()).precision;
  },
  pending() {
    return Transactions.findType(TRANSACTION_TYPE);
  },
  resetAmount() {
    this.amount(0);
  },
  maxAmount() {
    try {
      const token = Tokens.findOne(this.currency());
      return web3Obj.fromWei(token.balance).toString(10);
    } catch (e) {
      return '0';
    }
  },
  isWrappedToken() {
    return this.currency().indexOf('W-') !== -1;
  },
  canTransfer() {
    this.validAmount(true);
    if (this.precision() === 0 && this.amount() % 1 !== 0) {
      this.validAmount(false);
      return false;
    }
    try {
      const amount = new BigNumber(this.amount());
      const maxAmount = new BigNumber(this.maxAmount());
      const recipient = this.recipient();
      return /^(0x)?[0-9a-f]{40}$/i.test(recipient) && amount.gt(0) && amount.lte(maxAmount);
    } catch (e) {
      return false;
    }
  },
  fillAmount() {
    this.amount(this.maxAmount());
  },
  transfer(event) {
    function process(transaction) {
      let recipient = transaction.recipient().toLowerCase();
      if (!(/^0x/.test(recipient))) {
        recipient = '0x'.concat(recipient);
      }

      const options = { gas: TRANSFER_GAS };

      // XXX EIP20
      Dapple.getToken(transaction.currency(), (error, token) => {
        if (!error) {
          token.transfer(recipient, convertToTokenPrecision(transaction.amount(), transaction.currency()), options,
            (txError, tx) => {
              if (!txError) {
                Transactions.add(TRANSACTION_TYPE, tx, {
                  recipient,
                  amount: transaction.amount(),
                  token: transaction.currency(),
                });
              } else {
                transaction.lastError(formatError(txError));
              }
            });
        } else {
          transaction.lastError(error.toString());
        }
      });
    }

    event.preventDefault();
    const transaction = this;

    if (this.isWrappedToken()) {
      // https://www.w3.org/TR/css-position-3/#painting-order  - point 8
      // - for some reason the opacity of all order-s ection is 0.89. This creates stacking order. z-index of modal is ignored.
      $('.transfer-section').css('opacity', 1);
      $('#transferconfirmation').modal('show');
      $('#transferconfirmation').on('transfer:confirmed', (onConfirmation) => {
        onConfirmation.stopPropagation();
        process(transaction);
      });
    } else {
      process(transaction);
    }
  },
});

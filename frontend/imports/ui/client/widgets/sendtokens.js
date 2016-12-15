import { Template } from 'meteor/templating';
import { BigNumber } from 'meteor/ethereum:web3';
import { Dapple, web3 } from 'meteor/makerotc:dapple';
import { _ } from 'meteor/underscore';

import Transactions from '/imports/api/transactions';
import Tokens from '/imports/api/tokens';
import { formatError } from '/imports/utils/functions';

import './sendtokens.html';

const TRANSFER_GAS = 150000;
const TRANSACTION_TYPE = 'transfer';

Template.sendtokens.viewmodel({
  currency: 'MKR',
  currencies: Dapple.getTokens(),
  recipient: '',
  lastError: '',
  pending() {
    return Transactions.findType(TRANSACTION_TYPE);
  },
  amount: '0',
  maxAmount() {
    try {
      const token = Tokens.findOne(this.currency());
      return web3.fromWei(token.balance).toString(10);
    } catch (e) {
      return '0';
    }
  },
  canTransfer() {
    try {
      const amount = new BigNumber(this.amount());
      const maxAmount = new BigNumber(this.maxAmount());
      const recipient = this.recipient();
      return /^(0x)?[0-9a-f]{40}$/i.test(recipient) && amount.gt(0) && amount.lte(maxAmount);
    } catch (e) {
      return false;
    }
  },
  transfer(event) {
    event.preventDefault();

    this.lastError('');

    let recipient = this.recipient().toLowerCase();
    if (!(/^0x/.test(recipient))) {
      recipient = '0x'.concat(recipient);
    }

    const options = { gas: TRANSFER_GAS };

    // XXX EIP20
    Dapple.getToken(this.currency(), (error, token) => {
      if (!error) {
        token.transfer(recipient, web3.toWei(this.amount()), options, (txError, tx) => {
          if (!txError) {
            Transactions.add(TRANSACTION_TYPE, tx, { recipient, amount: this.amount(), token: this.currency() });
          } else {
            this.lastError(formatError(txError));
          }
        });
      } else {
        this.lastError(error.toString());
      }
    });
  },
});

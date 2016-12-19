import { Template } from 'meteor/templating';
import { BigNumber } from 'meteor/ethereum:web3';
import { Dapple, web3 } from 'meteor/makerotc:dapple';

import Transactions from '/imports/api/transactions';
import { formatError } from '/imports/utils/functions';

import { convertToAbsolute } from '/imports/utils/conversion';

import './newallowance.html';

const APPROVE_GAS = 150000;

Template.newallowance.viewmodel({
  value: '',
  allowance() {
    return Template.currentData().token.allowance;
  },
  pending() {
    return Transactions.findType('allowance_'.concat(Template.currentData().token._id));
  },
  lastError: '',
  autorun() {
    // Initialize value
    this.value(web3.fromWei(this.templateInstance.data.token.allowance));
  },
  canChange() {
    try {
      return this.pending().length === 0 && this.value() !== '' &&
        !(new BigNumber(this.value()).equals(new BigNumber(web3.fromWei(this.allowance()))));
    } catch (e) {
      return false;
    }
  },
  change(event) {
    event.preventDefault();

    this.lastError('');

    const contractAddress = Dapple['maker-otc'].environments[Dapple.env].otc.value;
    const options = { gas: APPROVE_GAS };

    // XXX EIP20
    Dapple.getToken(this.templateInstance.data.token._id, (error, token) => {
      if (!error) {
        token.approve(contractAddress,
              convertToAbsolute(this.value(), this.templateInstance.data.token._id), options, (txError, tx) => {
                if (!txError) {
                  Transactions.add('allowance_'.concat(this.templateInstance.data.token._id), tx,
                    { value: this.value(), token: this.templateInstance.data.token._id });
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

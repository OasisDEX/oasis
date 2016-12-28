import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import Tokens from '/imports/api/tokens';

import './depositbalance.html';

Template.depositbalance.viewmodel({
  wethBalance() {
    try {
      const token = Tokens.findOne('W-ETH');
      return web3.fromWei(token.balance).toString(10);
    } catch (e) {
      return '0';
    }
  },
  wgntBalance() {
    try {
      const token = Tokens.findOne('W-GNT');
      return web3.fromWei(token.balance).toString(10);
    } catch (e) {
      return '0';
    }
  },
  selected(token) {
    return token === this.baseCurrency() ? 'selected' : '';
  },
  baseChange() {
    console.log('token');
  },
});

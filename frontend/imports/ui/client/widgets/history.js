import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import TokenEvents from '/imports/api/tokenEvents';
import { txHref } from '/imports/utils/functions';

import './history.html';

Template.history.viewmodel({
  autorun() {
    if (this.historyType() === 'depositHistory') {
      Session.set('loadingWrapHistory', true);
    }
    if (this.historyType() === 'transferHistory') {
      Session.set('loadingTransferHistory', true);
    }
  },
  currencyClass(token) {
    return token === Session.get('quoteCurrency') ? 'quote-currency' : 'base-currency';
  },
  historyCount() {
    return this.history().count();
  },
  history() {
    const address = Session.get('address');
    return TokenEvents.find({
      type: { $in: ['deposit', 'withdrawal'] },
      $or: [{ to: address }, { from: address }],
    }, { sort: { blockNumber: -1 } });
  },
  transferHistory() {
    const address = Session.get('address');
    return TokenEvents.find({
      type: { $in: ['transfer'] },
      $or: [{ to: address }, { from: address }], //this triggers reactiveness when the user switches between addresses
    }, { sort: { blockNumber: -1 } });
  },
  transferHistoryCount() {
    return this.transferHistory().count();
  },
});

Template.history.events({
  'click tr.clickable': function offer(event) {
    event.preventDefault();
    if (this.transactionHash) {
      window.open(txHref(this.transactionHash), '_blank');
    }
  },
});

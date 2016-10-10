import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import TokenEvents from '/imports/api/tokenEvents';

import './history.html';

Template.history.viewmodel({
  currencyClass(token) {
    return token === Session.get('quoteCurrency') ? 'quote-currency' : 'base-currency';
  },
  history() {
    const address = Session.get('address');
    return TokenEvents.find({
      type: { $in: ['deposit', 'withdrawal'] },
      $or: [{ to: address }, { from: address }],
    }, { sort: { blockNumber: -1 } });
  },
  transferHistory() {
    // const address = Session.get('address');
    return TokenEvents.find({
      type: { $in: ['transfer'] },
       /* $or: [{ to: address }, { from: address }], */
    }, { sort: { blockNumber: -1 } });
  },
});

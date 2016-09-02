import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import './orders.html';
import './orderrow.js';

Template.orders.helpers({
  moreBtn() {
    if (this.priceClass) {
      // const orderBookLimit = Session.get('orderBookLimit');
      const totalOrders = Blaze._globalHelpers.countOffers(this.priceClass);
      return totalOrders > this.orders.count();
    }
    return false;
  },
  orderCount() {
    return parseInt(Blaze._globalHelpers.countOffers(this.priceClass), 10);
  },
});

Template.orders.events({
  'click .more': function setOrderBookLimit() {
    Session.set('orderBookLimit', 0);
  },
});

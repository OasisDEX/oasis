import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import './orders.html';
import './orderrow.js';

Template.orders.helpers({
  /* eslint-disable no-underscore-dangle */
  moreBtn: function showMoreBtn() {
    const type = Template.instance().data.type;
    if (type && type === 'lastTrades') {
      const totalOrders = Blaze._globalHelpers.countLastTrades();
      return (this.orders.count() < totalOrders);
    }
    const totalOffers = Blaze._globalHelpers.countOffers(type);
    return (this.orders.count() < totalOffers);
  },
  orderCount: function countOffersOrders() {
    const type = Template.instance().data.type;
    if (type && type === 'lastTrades') {
      return parseInt(Blaze._globalHelpers.countLastTrades(), 10);
    }
    return parseInt(Blaze._globalHelpers.countOffers(this.priceClass), 10);
  },
  /* eslint-enable no-underscore-dangle */
});

Template.orders.events({
  'click .more': function clickMore(event, templateInstance) {
    if (templateInstance.data.type === 'lastTrades') {
      Session.set('lastTradesLimit', 0);
    } else {
      Session.set('orderBookLimit', 0);
    }
  },
});

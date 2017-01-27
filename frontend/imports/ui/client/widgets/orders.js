import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

import './orders.html';
import './orderrow.js';

Template.orders.helpers({
  /* eslint-disable no-underscore-dangle */
  /* replaced by scrolling orders
  moreBtn: function showMoreBtn() {
    const type = Template.instance().data.type;
    if (type && type === 'lastTrades') {
      const totalOrders = Blaze._globalHelpers.countLastTrades();
      return (this.orders.count() < totalOrders);
    }
    const totalOffers = Blaze._globalHelpers.countOffers(type);
    return (this.orders.count() < totalOffers);
  },
  */
  ordersCount: function ordersCount() {
    return Template.instance().data.orders.count();
  },
  section: function section() {
    return Template.instance().data.type;
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

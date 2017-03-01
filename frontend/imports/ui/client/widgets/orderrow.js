import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';

import { txHref } from '/imports/utils/functions';

import './orderrow.html';

Template.orderRow.events({
  'click .cancel': function cancel(event, templateInstance) {
    event.preventDefault();
    event.stopPropagation();
    const orderId = templateInstance.data.order._id;
    Session.set('selectedOffer', orderId);
    $('#cancelModal').modal('show');
  },
  'click tr': function offer(event, templateInstance) {
    event.preventDefault();
    if (templateInstance.data.canOpenTxLink) {
      window.open(txHref(templateInstance.data.order.transactionHash), '_blank');
    }
  },
});

import './orders.html';
import './orderrow.js';
import { $ } from 'meteor/jquery';

Template.orders.helpers({
    moreBtn: function() {
        if(this.priceClass){
            const orderBookLimit = Session.get('orderBookLimit');
            const totalOrders = Blaze._globalHelpers.countOffers(this.priceClass);
            return (totalOrders > this.orders.count() ? true : false);
        }
    },
    orderCount: function(){
        return parseInt(Blaze._globalHelpers.countOffers(this.priceClass));
    }
    
});

Template.orders.events({
  'click .more': function(event, templateInstance) {
        Session.set('orderBookLimit',0);
    }
});
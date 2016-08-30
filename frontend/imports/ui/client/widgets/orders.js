import './orders.html';
import './orderrow.js';

Template.orders.helpers({
    moreBtn: function() {
        const type = Template.instance().data.type;
        if(type && type === 'lastTrades'){
            const lastTradesLimit = Session.get('lastTradesLimit');
            const totalOrders = Blaze._globalHelpers.countLastTrades();
            return ( (this.orders.count() < lastTradesLimit && this.orders.count() < totalOrders) ? true : false);
        }
    },
    orderCount: function(){
        return parseInt(Blaze._globalHelpers.countLastTrades());
    }
    
});

Template.orders.events({
  'click .more': function(event, templateInstance) {
        if (templateInstance.data.type === 'lastTrades') {
            console.log('last trades');
            Session.set('lastTradesLimit', 0);
        } else {
            Session.set('orderBookLimit', 0);
        }
    }
});
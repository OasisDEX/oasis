import { Template } from 'meteor/templating';

import { Offers } from '/imports/api/offers';

import './cancelmodal.html';


Template.cancelmodal.viewmodel({
  cancel() {
    const offerId = this.templateInstance.data.offer._id;
    Offers.cancelOffer(offerId);
  },
});

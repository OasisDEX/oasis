import { Template } from 'meteor/templating';

import './balance.html';

Template.balance.events({
  'click button.btn-change-allowance': (event, templateInstance) => {
    const token = templateInstance.data.currency;
    $(`#allowanceModal${token}`).data('refer', '');
    $(`#allowanceModal${token}`).modal('show');
  },
});


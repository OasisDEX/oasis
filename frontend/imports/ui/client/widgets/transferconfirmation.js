import { Template } from 'meteor/templating';

import './transferconfirmation.html';

Template.transferconfirmation.viewmodel({
  confirm() {
    $('#transferconfirmation').trigger('transfer:confirmed');
  },
});


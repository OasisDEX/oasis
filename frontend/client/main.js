import '/imports/startup/client';

import { Template } from 'meteor/templating';

Template.body.events({
  'keypress input[type=text].number'(event) {
    const charCode = (event.which) ? event.which : event.keyCode;
    /**
     * code 46  -> '.'
     * code 48  -> '0'
     * code 57  -> '9'
     */
    return ((charCode === 46 && !event.target.value.includes('.')) || (charCode >= 48 && charCode <= 57));
  },
});

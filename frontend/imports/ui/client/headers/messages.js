import { Template } from 'meteor/templating';
// import { Session } from 'meteor/session';

import './messages.html';

Template.messages.viewmodel({
  warningOpen: true,
  updateOpen: true,
  closeMessage(type) {
    if (type === 'update') {
      this.updateOpen(false);
    } else if (type === 'warning') {
      this.warningOpen(false);
    }
  },
});

import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { doHashChange } from '/imports/utils/functions';

import './tabs.html';

Template.tabs.viewmodel({
  currentTab: '',
  changeTab(e) {
    const tab = e.target.hash;
    if (tab !== this.currentTab) {
      this.currentTab = tab;
      if (tab !== '#trade') {
        location.hash = tab;
      } else {
        location.hash = `#trade/${Session.get('baseCurrency')}/${Session.get('quoteCurrency')}`;
      }
      doHashChange();
    }
  },
});

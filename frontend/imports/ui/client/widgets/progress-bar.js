import { Template } from 'meteor/templating';

import './progress-bar.html';

Template.progressbar.viewmodel({
  autorun() {
    const newWidth = (this.value() / this.max()) * 100;
    this.templateInstance.$('.dex-progress').width(`${newWidth}%`);
  },
});

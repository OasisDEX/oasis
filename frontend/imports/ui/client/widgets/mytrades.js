import { Template } from 'meteor/templating';
import { Status } from '/imports/api/offers';

import './mytrades.html';

Template.mytrades.viewmodel({
  orderStatus: [Status.OPENED, Status.CLOSED],
  filterByStatus: Status.OPENED,
});

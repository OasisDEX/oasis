import { Template } from 'meteor/templating';
import { Status } from '/imports/api/offers';

import './mytrades.html';

Template.mytrades.viewmodel({
  status: Status,
  orderStatus: [Status.OPEN, Status.CLOSED],
  filterByStatus: Status.OPEN,
});

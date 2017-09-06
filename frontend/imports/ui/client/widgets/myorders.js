import { Template } from 'meteor/templating';
import { Status } from '/imports/api/offers';

import './myorders.html';

Template.myorders.viewmodel({
  status: Status,
  orderStatus: [Status.OPEN, Status.CLOSED],
  filterByStatus: Status.OPEN,
});

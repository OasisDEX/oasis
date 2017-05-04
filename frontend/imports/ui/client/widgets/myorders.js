import { Template } from 'meteor/templating';
import { Status } from '/imports/api/offers';

import './myorders.html';

Template.myorders.viewmodel({
  orderStatus: [Status.OPENED, Status.CLOSED],
  filterByStatus: Status.OPENED
});

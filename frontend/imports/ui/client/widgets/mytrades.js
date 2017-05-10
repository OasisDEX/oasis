import { Template } from 'meteor/templating';
import { Status } from '/imports/api/offers';

import './mytrades.html';

Template.mytrades.viewmodel({
  orderStatus: [Status.OPEN.toUpperCase(), Status.CLOSED.toUpperCase()],
  filterByStatus: Status.OPEN.toUpperCase(),
});

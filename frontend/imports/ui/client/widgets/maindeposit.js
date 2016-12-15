import { Template } from 'meteor/templating';
import './maindeposit.html';
import { doTabShow } from '../../../utils/functions.js';

Template.maindeposit.onRendered(() => {
  doTabShow();
});

import { Template } from 'meteor/templating';
import './maintransfer.html';
import { doTabShow } from '../../../utils/functions.js';

Template.maintransfer.onRendered(() => {
  doTabShow();
});

import { Template } from 'meteor/templating';
import { web3Obj } from 'meteor/makerotc:dapple';

import './noaccount.html';

Template.noAccount.helpers({
  metamask: function metamask() {
    return web3Obj &&
           web3Obj.currentProvider &&
           (
             web3Obj.currentProvider.isMetaMask ||
             web3Obj.currentProvider.constructor.name === 'MetamaskInpageProvider'
           );
  },
});

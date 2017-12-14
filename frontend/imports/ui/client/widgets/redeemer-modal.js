import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import Redeemer from '/imports/utils/redeemer';
import './progress-bar.js';
import './redeemer-modal.html';

Template.redeemer.viewmodel({
  message: '',
  current: 0,
  inProgress: false,

  resetProgressBar() {
    this.current(0);
    this.message('');
    this.inProgress(false);
  },
  onInterruptedWrapping(error) {
    this.resetProgressBar();
    this.message('Unwrapping interrupted! Please try again!');
    console.debug('Received error during unwrapping: ', error);
  },

  async redeem() {
    const account = Session.get('address');
    const redeemer = new Redeemer(Dapple.env);
    this.inProgress(true);

    const allowance = await redeemer.allowanceOf(account);
    const balance = await redeemer.balanceOf(account);

    if (allowance < balance) {
      this.current(33);
      this.message('Confirming redeem process...');
      await redeemer.approve(account);
    }

    this.current(66);
    this.message('Redeeming new MKR tokens');
    await redeemer.redeem();

    this.current(100);
    this.message('Redeeming Done!');
    setTimeout(() => {
      this.inProgress(false);
      /**
       * Nasty workaround because $('#redeemer').modal('hide') not working on surge.
       * Even invoked within dev console it's still  not closing the modal.
       * @type {*}
       */
      const modal = $('#redeemer');
      modal.removeClass('in');
      modal.css('display', 'none');

      const body = $('body');
      body.removeClass('modal-open');
      body.css('padding-right', '0');

      const redeemerModal = document.getElementById('redeemer');
      redeemerModal.dispatchEvent(new Event('hide-modal'));
    }, 1000);
  },
});


import { chai } from 'meteor/practicalmeteor:chai';
import { MeteorStubs } from 'meteor/velocity:meteor-stubs';
import StubCollections from 'meteor/hwillson:stub-collections';
import DappleTokenSpy from '/imports/test/dapple-token-spy';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import Transactions from '/imports/api/transactions';
import Tokens from '/imports/api/tokens';

import './ethtokens.js';

const fakeEvent = {
  preventDefault() {
    return;
  },
};

describe('EthTokens View Model', () => {
  let vm;
  let dappleBackup;
  beforeEach(() => {
    vm = Template.ethtokens.createViewModel();
    MeteorStubs.install();
    StubCollections.stub([Tokens, Transactions]);
    dappleBackup = Dapple;
  });
  afterEach(() => {
    MeteorStubs.uninstall();
    StubCollections.restore();
    Dapple = dappleBackup;
  });
  it('should have default properties', () => {
    chai.assert.equal(vm.type(), 'deposit');
    chai.assert.equal(vm.amount(), '');
    chai.assert.equal(vm.lastError(), '');
  });
  describe('maxAmount', () => {
    it('should return ETH balance when depositing', () => {
      vm.type('deposit');
      Session.set('ETHBalance', '1230000000000000000');
      chai.assert.equal(vm.maxAmount(), '1.23');
    });
    it('should return W-ETH balance when withdrawing', () => {
      vm.type('withdraw');
      Tokens.insert({ _id: 'W-ETH', balance: '3450000000000000000' });
      chai.assert.equal(vm.maxAmount(), '3.45');
    });
  });
  describe('canDeposit', () => {
    beforeEach(() => {
      Session.set('ETHBalance', '1230000000000000000');
    });
    it('should return true when depositing more than zero and less than maxAmount', () => {
      vm.type('deposit');
      vm.amount('1.00');
      chai.assert.isTrue(vm.canDeposit());
    });
    it('should return false when depositing zero', () => {
      vm.type('deposit');
      vm.amount('0');
      chai.assert.isFalse(vm.canDeposit());
    });
    it('should return false when depositing more than maxAmount', () => {
      vm.type('deposit');
      vm.amount('3.50');
      chai.assert.isFalse(vm.canDeposit());
    });
  });
  describe('deposit', () => {
    beforeEach(() => {
      Session.set('ETHBalance', '1230000000000000000');
      Tokens.insert({ _id: 'W-ETH', balance: '3450000000000000000' });
    });
    it('should call token.deposit when depositing', () => {
      const tokenSpy = new DappleTokenSpy(true, true);
      Dapple = tokenSpy;
      vm.type('deposit');
      vm.amount('1.00');
      vm.deposit(fakeEvent);
      const tx = Transactions.findOne();
      chai.assert.equal(tx.tx, 'txid');
      chai.assert.equal(tx.type, 'ethtokens');
      chai.assert.deepEqual(tx.object, { type: 'deposit', amount: '1.00' });
    });
    it('should set lastError when an error happens getting the token upon deposit', () => {
      const tokenSpy = new DappleTokenSpy(false, true);
      Dapple = tokenSpy;
      vm.type('deposit');
      vm.amount('1.00');
      vm.deposit(fakeEvent);
      chai.assert.equal(vm.lastError(), 'token lookup error');
    });
    it('should set lastError when an error happens getting the token upon withdraw', () => {
      const tokenSpy = new DappleTokenSpy(false, true);
      Dapple = tokenSpy;
      vm.type('withdraw');
      vm.amount('1.00');
      vm.deposit(fakeEvent);
      chai.assert.equal(vm.lastError(), 'token lookup error');
    });
    it('should set lastError when an error happens calling the token upon deposit', () => {
      const tokenSpy = new DappleTokenSpy(true, false);
      Dapple = tokenSpy;
      vm.type('deposit');
      vm.amount('1.00');
      vm.deposit(fakeEvent);
      chai.assert.equal(vm.lastError(), 'token.deposit call error');
    });
    it('should set lastError when an error happens calling the token upon withdraw', () => {
      const tokenSpy = new DappleTokenSpy(true, false);
      Dapple = tokenSpy;
      vm.type('withdraw');
      vm.amount('1.00');
      vm.deposit(fakeEvent);
      chai.assert.equal(vm.lastError(), 'token.withdraw call error');
    });
  });
});

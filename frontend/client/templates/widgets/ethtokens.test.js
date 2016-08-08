import { chai } from 'meteor/practicalmeteor:chai'
import { MeteorStubs } from 'meteor/velocity:meteor-stubs'
import StubCollections from 'meteor/hwillson:stub-collections'

import '../../lib/_transactions.js'
import '../../lib/tokens.js'
import './ethtokens.js'

class DappleTokenSpy {
  constructor(canLookup, canCall) {
    this.canLookup = canLookup
    this.canCall = canCall
  }
  getToken(tokenName, tokenCb) {
    var _this = this
    if (this.canLookup) {
      let token = {
        deposit: function (options, cb) {
          if (_this.canCall) {
            cb(false, 'txid')
          } else {
            cb('token call error', null)
          }
        },
        withdraw: function (amount, options, cb) {
          if (_this.canCall) {
            cb(false, 'txid')
          } else {
            cb('token call error', null)
          }
        }
      }
      tokenCb(false, token)
    } else {
      tokenCb('token lookup error', null)
    }
  }
}

const fakeEvent = {
  preventDefault: function() {
    return
  }
}

describe("EthTokens View Model", function() {
  var vm
  var _dappleGetTokenBackup
  beforeEach(function () {
    vm = Template.ethtokens.createViewModel()
    MeteorStubs.install()
    StubCollections.stub([Tokens, Transactions])
    _dappleBackup = Dapple
  })
  afterEach(function () {
    MeteorStubs.uninstall()
    StubCollections.restore()
    Dapple = _dappleBackup
  })
  it("should have default properties", function () {
    chai.assert.equal(vm.type(), 'deposit')
    chai.assert.equal(vm.amount(), '')
    chai.assert.equal(vm.lastError(), '')
  })
  describe("maxAmount", function() {
    it("should return ETH balance when depositing", function () {
      vm.type('deposit')
      Session.set('ETHBalance', '1230000000000000000')
      chai.assert.equal(vm.maxAmount(), '1.23')
    });
    it("should return ETH token balance when withdrawing", function () {
      vm.type('withdraw')
      Tokens.insert({_id: 'ETH', balance: '3450000000000000000'})
      chai.assert.equal(vm.maxAmount(), '3.45')
    })
  })
  describe("canDeposit", function() {
    beforeEach(function () {
      Session.set('ETHBalance', '1230000000000000000')
    })
    it("should return true when depositing more than zero and less than maxAmount", function () {
      vm.type('deposit')
      vm.amount('1.00')
      chai.assert.isTrue(vm.canDeposit())
    });
    it("should return false when depositing zero", function () {
      vm.type('deposit')
      vm.amount('0')
      chai.assert.isFalse(vm.canDeposit())
    })
    it("should return false when depositing more than maxAmount", function () {
      vm.type('deposit')
      vm.amount('3.50')
      chai.assert.isFalse(vm.canDeposit())
    })
  })
  describe("deposit", function() {
    beforeEach(function () {
      Session.set('ETHBalance', '1230000000000000000')
      Tokens.insert({_id: 'ETH', balance: '3450000000000000000'})
    })
    it("should call token.deposit when depositing", function () {
      let tokenSpy = new DappleTokenSpy(true, true)
      Dapple = tokenSpy
      vm.type('deposit')
      vm.amount('1.00')
      vm.deposit(fakeEvent)
      let tx = Transactions.findOne()
      console.log('tx', tx)
      chai.assert.equal(tx.tx, 'txid')
      chai.assert.equal(tx.type, 'ethtokens')
      chai.assert.deepEqual(tx.object, {type: 'deposit', amount: '1.00'})
    })
    it("should set lastError when an error happens getting the token upon deposit", function () {
      let tokenSpy = new DappleTokenSpy(false, true)
      Dapple = tokenSpy
      vm.type('deposit')
      vm.amount('1.00')
      vm.deposit(fakeEvent)
      chai.assert.equal(vm.lastError(), 'token lookup error')
    })
    it("should set lastError when an error happens getting the token upon withdraw", function () {
      let tokenSpy = new DappleTokenSpy(false, true)
      Dapple = tokenSpy
      vm.type('withdraw')
      vm.amount('1.00')
      vm.deposit(fakeEvent)
      chai.assert.equal(vm.lastError(), 'token lookup error')
    })
    it("should set lastError when an error happens calling the token upon deposit", function () {
      let tokenSpy = new DappleTokenSpy(true, false)
      Dapple = tokenSpy
      vm.type('deposit')
      vm.amount('1.00')
      vm.deposit(fakeEvent)
      chai.assert.equal(vm.lastError(), 'token call error')
    })
    it("should set lastError when an error happens calling the token upon withdraw", function () {
      let tokenSpy = new DappleTokenSpy(true, false)
      Dapple = tokenSpy
      vm.type('withdraw')
      vm.amount('1.00')
      vm.deposit(fakeEvent)
      chai.assert.equal(vm.lastError(), 'token call error')
    })
  })

})
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Dapple, web3 } from 'meteor/makerotc:dapple';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

import Transactions from '/imports/api/transactions';
import Tokens from '/imports/api/tokens';
import TokenEvents from '/imports/api/tokenEvents';
import WETH from '/imports/api/weth';
import WGNT from '/imports/api/wgnt';
import { Offers, Status } from '/imports/api/offers';
import { doHashChange } from '/imports/utils/functions';

// Check which accounts are available and if defaultAccount is still available,
// Otherwise set it to localStorage, Session, or first element in accounts
function checkAccounts() {
  web3.eth.getAccounts((error, accounts) => {
    if (!error) {
      if (!_.contains(accounts, web3.eth.defaultAccount)) {
        if (_.contains(accounts, localStorage.getItem('address'))) {
          web3.eth.defaultAccount = localStorage.getItem('address');
        } else if (_.contains(accounts, Session.get('address'))) {
          web3.eth.defaultAccount = Session.get('address');
        } else if (accounts.length > 0) {
          web3.eth.defaultAccount = accounts[0];
        } else {
          web3.eth.defaultAccount = undefined;
        }
      }
      localStorage.setItem('address', web3.eth.defaultAccount);
      Session.set('address', web3.eth.defaultAccount);
      Session.set('accounts', accounts);
    }
  });
}

// Initialize everything on new network
function initNetwork(newNetwork) {
  Dapple.init(newNetwork);
  checkAccounts();
  Session.set('network', newNetwork);
  Session.set('isConnected', true);
  Session.set('latestBlock', 0);
  Session.set('startBlock', 0);
  Tokens.sync();
  Offers.sync();
}

// Check the closing time of the market and if it's open now
function checkMarketOpen() {
  Offers.checkMarketOpen();
}

// CHECK FOR NETWORK
function checkNetwork() {
  web3.version.getNode((error) => {
    const isConnected = !error;

    // Check if we are synced
    if (isConnected) {
      web3.eth.getBlock('latest', (e, res) => {
        if (res.number >= Session.get('latestBlock')) {
          Session.set('outOfSync', e != null || (new Date().getTime() / 1000) - res.timestamp > 600);
          Session.set('latestBlock', res.number);
          if (Session.get('startBlock') === 0) {
            console.log(`Setting startblock to ${res.number - 6000}`);
            Session.set('startBlock', (res.number - 6000));
          }
        } else {
          // XXX MetaMask frequently returns old blocks
          // https://github.com/MetaMask/metamask-plugin/issues/504
          console.debug('Skipping old block');
        }
      });
    }

    // Check which network are we connected to
    // https://github.com/ethereum/meteor-dapp-wallet/blob/90ad8148d042ef7c28610115e97acfa6449442e3/app/client/lib/ethereum/walletInterface.js#L32-L46
    if (!Session.equals('isConnected', isConnected)) {
      if (isConnected === true) {
        web3.eth.getBlock(0, (e, res) => {
          let network = false;
          if (!e) {
            switch (res.hash) {
              case '0x41941023680923e0fe4d74a34bdac8141f2540e3ae90623718e47d66d1ca4a2d':
                network = 'ropsten';
                break;
              case '0x0cd786a2425d16f152c658316c423e6ce1181e15c3295826d7c9904cba9ce303':
                network = 'morden';
                break;
              case '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3':
                network = 'main';
                break;
              default:
                network = 'private';
            }
          }
          if (!Session.equals('network', network)) {
            initNetwork(network, isConnected);
          }
        });
      } else {
        Session.set('isConnected', isConnected);
        Session.set('network', false);
        Session.set('latestBlock', 0);
      }
    }
  });
}

$(window).on('hashchange', () => {
  doHashChange();
});

function initSession() {
  Session.set('network', false);
  Session.set('loading', false);
  Session.set('outOfSync', false);
  Session.set('syncing', false);
  Session.set('isConnected', false);
  Session.set('latestBlock', 0);

  doHashChange();

  Session.set('ETHDepositProgress', 0);
  Session.set('ETHDepositProgressMessage', '');
  Session.set('ETHDepositErrorMessage', '');
  Session.set('ETHWithdrawProgress', 0);
  Session.set('ETHWithdrawProgressMessage', '');
  Session.set('ETHWithdrawErrorMessage', '');
  Session.set('GNTDepositProgress', 0);
  Session.set('GNTDepositProgressMessage', '');
  Session.set('GNTDepositErrorMessage', '');
  Session.set('GNTWithdrawProgress', 0);
  Session.set('GNTWithdrawProgressMessage', '');
  Session.set('GNTWithdrawErrorMessage', '');
}

/**
 * Startup code
 */
Meteor.startup(() => {
  initSession();
  checkNetwork();

  web3.eth.filter('latest', () => {
    Tokens.sync();
    Transactions.sync();
    TokenEvents.syncTimestamps();
  });

  web3.eth.isSyncing((error, sync) => {
    if (!error) {
      Session.set('syncing', sync !== false);

      // Stop all app activity
      if (sync === true) {
        // We use `true`, so it stops all filters, but not the web3.eth.syncing polling
        web3.reset(true);
        checkNetwork();
      // show sync info
      } else if (sync) {
        Session.set('startingBlock', sync.startingBlock);
        Session.set('currentBlock', sync.currentBlock);
        Session.set('highestBlock', sync.highestBlock);
      } else {
        Session.set('outOfSync', false);
        Offers.sync();
        web3.eth.filter('latest', () => {
          Tokens.sync();
          Transactions.sync();
        });
      }
    }
  });

  function syncAndSetMessageOnError(document) {
    Offers.syncOffer(document.object.id);
    let helperMsg = '';
    if (document.receipt.logs.length === 0) {
      helperMsg = `${document.object.status.toUpperCase()}: Error during Contract Execution`;
    }
    Offers.update(document.object.id, { $set: { helper: helperMsg } });
  }

  function setMessageAndScheduleRemoval(document) {
    // The ItemUpdate event will be triggered on successful generation, which will delete the object; otherwise set helper
    Offers.update(document.object.id, { $set: { helper: 'Error during Contract Execution' } });
    Meteor.setTimeout(() => {
      Offers.remove(document.object.id);
    }, 5000);
  }

  Transactions.observeRemoved('offer', (document) => {
    switch (document.object.status) {
      case Status.CANCELLED:
        syncAndSetMessageOnError(document);
        break;
      case Status.BOUGHT:
        syncAndSetMessageOnError(document);
        break;
      case Status.PENDING:
        setMessageAndScheduleRemoval(document);
        break;
      default:
        break;
    }
  });

  Meteor.setInterval(checkNetwork, 2503);
  Meteor.setInterval(checkAccounts, 10657);
  Meteor.setInterval(checkMarketOpen, 11027);
});

Meteor.autorun(() => {
  TokenEvents.watchTokenEvents();
  TokenEvents.watchGNTTokenEvents();
  WGNT.watchBrokerCreation();
  WGNT.watchBrokerTransfer();
  WGNT.watchBrokerClear();
  WGNT.watchWithdraw();
  WETH.watchDeposit();
  WETH.watchWithdraw();
});

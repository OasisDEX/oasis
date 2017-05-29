import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Dapple, web3Obj } from 'meteor/makerotc:dapple';
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
  web3Obj.eth.getAccounts((error, accounts) => {
    if (!error) {
      if (!_.contains(accounts, web3Obj.eth.defaultAccount)) {
        if (_.contains(accounts, localStorage.getItem('address'))) {
          web3Obj.eth.defaultAccount = localStorage.getItem('address');
        } else if (_.contains(accounts, Session.get('address'))) {
          web3Obj.eth.defaultAccount = Session.get('address');
        } else if (accounts.length > 0) {
          web3Obj.eth.defaultAccount = accounts[0];
        } else {
          web3Obj.eth.defaultAccount = undefined;
        }
      }
      localStorage.setItem('address', web3Obj.eth.defaultAccount);
      Session.set('address', web3Obj.eth.defaultAccount);
      Session.set('accounts', accounts);
    }
  });
}

function checkIfOrderMatchingEnabled(marketType) {
  if (marketType !== 'MatchingMarket') {
    Session.set('isOrderMatchingEnabled', false);
  } else {
    const abi = Dapple['maker-otc'].objects.otc.abi;
    const addr = Dapple['maker-otc'].environments[Dapple.env].otc.value;

    const contract = web3Obj.eth.contract(abi).at(addr);
    contract.ema((error, result) => {
      Session.set('isMatchingEnabled', result);
    });
  }
}

function checkIfBuyEnabled(marketType) {
  if (marketType !== 'MatchingMarket') {
    Session.set('isBuyEnabled', true);
  } else {
    const abi = Dapple['maker-otc'].objects.otc.abi;
    const addr = Dapple['maker-otc'].environments[Dapple.env].otc.value;

    const contract = web3Obj.eth.contract(abi).at(addr);
    contract.isBuyEnabled((error, result) => {
      Session.set('isBuyEnabled', result);
    });
  }
}

// Initialize everything on new network
function initNetwork(newNetwork) {
  Dapple.init(newNetwork);
  const market = Dapple['maker-otc'].environments.kovan.otc;
  checkAccounts();
  checkIfOrderMatchingEnabled(market.type);
  checkIfBuyEnabled(market.type);
  Session.set('network', newNetwork);
  Session.set('isConnected', true);
  Session.set('latestBlock', 0);
  Session.set('startBlock', 0);
  doHashChange();
  Tokens.sync();
  Offers.sync();
}

// Check the closing time of the market and if it's open now
function checkMarketOpen() {
  Offers.checkMarketOpen();
}

// CHECK FOR NETWORK
function checkNetwork() {
  if (Session.get('web3ObjReady') && typeof web3Obj !== 'undefined') {
    web3Obj.version.getNode((error) => {
      const isConnected = !error;

      // Check if we are synced
      if (isConnected) {
        web3Obj.eth.getBlock('latest', (e, res) => {
          if (!e) {
            if (res && res.number >= Session.get('latestBlock')) {
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
          } else {
            console.debug('There is error while getting the latest block! ', e);
          }
        });
      }

      // Check which network are we connected to
      // https://github.com/ethereum/meteor-dapp-wallet/blob/90ad8148d042ef7c28610115e97acfa6449442e3/app/client/lib/ethereum/walletInterface.js#L32-L46
      if (!Session.equals('isConnected', isConnected)) {
        if (isConnected === true) {
          web3Obj.version.getNetwork((e, res) => {
            let network = false;
            if (!e) {
              switch (res) {
                case '1':
                  network = 'main';
                  Session.set('AVGBlocksPerDay', 5760);
                  break;
                case '3':
                  network = 'ropsten';
                  Session.set('AVGBlocksPerDay', 5760);
                  break;
                case '42':
                  network = 'kovan';
                  Session.set('AVGBlocksPerDay', 21600);
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
}

$(window).on('hashchange', () => {
  doHashChange();
});

function initSession() {
  Session.set('network', false);
  Session.set('loading', false);
  Session.set('loadingProgress', 0); // This is needed when order matching is not enabled
  Session.set('loadingCounter', 0);
  Session.set('outOfSync', false);
  Session.set('syncing', false);
  Session.set('isConnected', false);
  Session.set('latestBlock', 0);

  Session.set('balanceLoaded', false);
  Session.set('allowanceLoaded', false);

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
  Session.set('loadingTradeHistory', true);
  Session.set('loadingIndividualTradeHistory', false); // this will be loading only if the user filter by closed status of orders
  Session.set('AVGBlocksPerDay', null);
  Session.set('watchedEvents', false);
  if (!Session.get('volumeSelector')) {
    Session.set('volumeSelector', 'quote');
  }

  Session.set('orderBookDustLimit', { 'W-ETH': 1000000000000000 });
}

/**
 * Startup code
 */
Meteor.startup(() => {
  initSession();

  const syncingInterval = setInterval(
    () => {
      if (Session.get('web3ObjReady')) {
        checkNetwork();

        web3Obj.eth.filter('latest', () => {
          Tokens.sync();
          Transactions.sync();
          TokenEvents.syncTimestamps();
        });

        web3Obj.eth.isSyncing((error, sync) => {
          if (!error) {
            Session.set('syncing', sync !== false);

            // Stop all app activity
            if (sync === true) {
              // We use `true`, so it stops all filters, but not the web3Obj.eth.syncing polling
              web3Obj.reset(true);
              checkNetwork();
              // show sync info
            } else if (sync) {
              Session.set('startingBlock', sync.startingBlock);
              Session.set('currentBlock', sync.currentBlock);
              Session.set('highestBlock', sync.highestBlock);
            } else {
              Session.set('outOfSync', false);
              Offers.sync();
              web3Obj.eth.filter('latest', () => {
                Tokens.sync();
                Transactions.sync();
              });
            }
          }
        });
        clearInterval(syncingInterval);
      }
    }, 350,
  );

  // Session.set('web3Interval', web3Interval);

  function syncAndSetMessageOnError(document) {
    Offers.syncOffer(document.object.id);
    if (document.receipt.logs.length === 0) {
      const helperMsg = `${document.object.status.toUpperCase()}: Error during Contract Execution`;
      Offers.update(document.object.id, { $set: { helper: helperMsg } });
    }
  }

  function setMessageAndScheduleRemovalOnError(document) {
    // The ItemUpdate event will be triggered on successful generation, otherwise set helper
    if (document.receipt.logs.length === 0) {
      Offers.update(document.object.id, { $set: { helper: 'Error during Contract Execution' } });
      Meteor.setTimeout(() => {
        Offers.remove(document.object.id);
      }, 5000);
    }
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
        setMessageAndScheduleRemovalOnError(document);
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
  TokenEvents.watchEvents();
  WGNT.watchBrokerCreation();
  WGNT.watchBrokerTransfer();
  WGNT.watchBrokerClear();
  WGNT.watchWithdraw();
  WETH.watchDeposit();
  WETH.watchWithdraw();
});

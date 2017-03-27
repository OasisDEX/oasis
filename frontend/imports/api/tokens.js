import { Mongo } from 'meteor/mongo';
import { Session } from 'meteor/session';
import { Dapple, web3 } from 'meteor/makerotc:dapple';
import { convertTo18Precision } from '/imports/utils/conversion';

class TokensCollection extends Mongo.Collection {
  /**
   * Syncs the quote and base currencies' balances and allowances of selected account,
   * usually called for each new block
   */
  sync() {
    const network = Session.get('network');
    const address = web3.eth.defaultAccount;
    if (address) {
      web3.eth.getBalance(address, (error, balance) => {
        const newETHBalance = balance.toString(10);
        if (!error && !Session.equals('ETHBalance', newETHBalance)) {
          Session.set('ETHBalance', newETHBalance);
        }
      });

      // Get GNTBalance
      // XXX EIP20
      Dapple.getToken('GNT', (error, token) => {
        if (!error) {
          token.balanceOf(address, (callError, balance) => {
            const newGNTBalance = balance.toString(10);
            if (!error && !Session.equals('GNTBalance', newGNTBalance)) {
              Session.set('GNTBalance', newGNTBalance);
            }
          });
          const broker = Session.get('GNTBroker');
          if (typeof broker === 'undefined' || broker === '0x0000000000000000000000000000000000000000') {
            Session.set('GNTBrokerBalance', 0);
          } else {
            token.balanceOf(broker, (callError, balance) => {
              if (!callError) {
                const newGNTBrokerBalance = balance.toString(10);
                Session.set('GNTBrokerBalance', newGNTBrokerBalance);
              }
            });
          }
        }
      });

      // const ALL_TOKENS = _.uniq([Session.get('quoteCurrency'), Session.get('baseCurrency')]);
      const ALL_TOKENS = Dapple.getTokens();

      // Sync token balances and allowances asynchronously
      ALL_TOKENS.forEach((tokenId) => {
        // XXX EIP20
        Dapple.getToken(tokenId, (error, token) => {
          if (!error) {
            token.balanceOf(address, (callError, balance) => {
              if (!error) {
                super.upsert(tokenId, { $set: {
                  balance: convertTo18Precision(balance, tokenId).toString(10),
                  realBalance: balance.toString(10),
                } });
                Session.set('balanceLoaded', true);
                if (tokenId === 'W-GNT') {
                  token.getBroker.call((e, broker) => {
                    if (!e) {
                      super.upsert('W-GNT', { $set: { broker } });
                      Session.set('GNTBroker', broker);
                    }
                  });
                }
              }
            });
            const contractAddress = Dapple['maker-otc'].environments[Dapple.env].otc.value;
            token.allowance(address, contractAddress, (callError, allowance) => {
              if (!error) {
                super.upsert(tokenId, { $set: {
                  allowance: convertTo18Precision(allowance, tokenId).toString(10),
                  realAllowance: allowance.toString(10),
                } });
                Session.set('allowanceLoaded', true);
              }
            });
          }
        });
      });
    }
  }
}

export default new TokensCollection(null);

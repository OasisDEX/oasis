import { Mongo } from 'meteor/mongo';
import { Session } from 'meteor/session';
import { Dapple, web3 } from 'meteor/makerotc:dapple';
import { _ } from 'meteor/underscore';

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

      const ALL_TOKENS = _.uniq([Session.get('quoteCurrency'), Session.get('baseCurrency')]);

      if (network !== 'private') {
        // Sync token balances and allowances asynchronously
        ALL_TOKENS.forEach((tokenId) => {
          // XXX EIP20
          Dapple.getToken(tokenId, (error, token) => {
            if (!error) {
              token.balanceOf(address, (callError, balance) => {
                if (!error) {
                  super.upsert(tokenId, { $set: { balance: balance.toString(10) } });
                }
              });
              const contractAddress = Dapple['maker-otc'].objects.otc.address;
              token.allowance(address, contractAddress, (callError, allowance) => {
                if (!error) {
                  super.upsert(tokenId, { $set: { allowance: allowance.toString(10) } });
                }
              });
            }
          });
        });
      } else {
        ALL_TOKENS.forEach((token) => {
          super.upsert(token, { $set: { balance: '0', allowance: '0' } });
        });
      }
    }
  }
}

export default new TokensCollection(null);

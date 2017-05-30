import { Mongo } from 'meteor/mongo';
import { Session } from 'meteor/session';
import { Dapple } from 'meteor/makerotc:dapple';
import { BigNumber } from 'meteor/ethereum:web3';

class LimitsCollection extends Mongo.Collection {
  // Sync token sell limits asynchronously
  sync() {
    function getMinSell(sellToken) {
      const sellTokenAddress = Dapple.getTokenAddress(sellToken);

      return new Promise((resolve, reject) => {
        Dapple['maker-otc'].objects.otc.getMinSell(sellTokenAddress, (error, amount) => {
          if (!error) {
            resolve([sellToken, amount]);
          } else {
            reject(error);
          }
        });
      });
    }

    const promises = Dapple.getTokens()
      .map((token) => getMinSell(token))
      .map((promise) => {
        promise.then((tokenAndAmount) => {
          const token = tokenAndAmount[0];
          const amount = tokenAndAmount[1];
          super.upsert(token, { $set: { limit: amount.toString() } });
        });
      });

    Promise.all(promises).then(() => {
      Session.set('limitsLoaded', true);
    });
  }

  limitForToken(token) {
    return new BigNumber(super.findOne(token).limit);
  }
}

export default new LimitsCollection(null);

import { Mongo } from 'meteor/mongo';
import { Session } from 'meteor/session';
import { dapp, web3 } from 'meteor/makerotc:dapp';
import { BigNumber } from 'meteor/ethereum:web3';
import { convertTo18Precision } from '/imports/utils/conversion';

class LimitsCollection extends Mongo.Collection {
  // Sync token sell limits asynchronously
  sync() {
    function getMinSellAmount(sellToken) {
      const sellTokenAddress = dapp.getTokenAddress(sellToken);

      return new Promise((resolve, reject) => {
        dapp['maker-otc'].objects.otc.getMinSellAmount(sellTokenAddress, (error, amount) => {
          if (!error) {
            resolve([sellToken, amount]);
          } else {
            reject(error);
          }
        });
      })
    }

    const promises = dapp.getTokens()
      .map((token) => getMinSellAmount(token))
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
  };

  limitForToken(token) {
    return new BigNumber(super.findOne(token).limit);
  }
}

export default new LimitsCollection(null);

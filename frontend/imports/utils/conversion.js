import { Dapple, web3 } from 'meteor/makerotc:dapple';
import { BigNumber } from 'meteor/ethereum:web3';

export default function convertToWei(amount, token) {
  const tokenSpecs = Dapple.getTokenSpecs(token);
  const precision = tokenSpecs !== undefined ? tokenSpecs.precision : 18;
  if (precision === 18) {
    return web3.toWei(amount);
  }
  let value = amount;
  if (!(amount instanceof BigNumber)) {
    value = new BigNumber(amount);
  }
  return value.times(Math.pow(10, precision)).valueOf();
}

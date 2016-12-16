import { Dapple } from 'meteor/makerotc:dapple';
import { BigNumber } from 'meteor/ethereum:web3';

export function convertToAbsolute(amount, token) {
  if (typeof token !== 'undefined' && token !== '') {
    const tokenSpecs = Dapple.getTokenSpecs(token);
    const precision = tokenSpecs !== undefined ? tokenSpecs.precision : 18;

    let value = amount;
    if (!(amount instanceof BigNumber)) {
      value = new BigNumber(amount);
    }
    return value.times(Math.pow(10, precision)).valueOf();
  } else {
    console.log('Token not found when converting');
    return false;
  }
}

export function convertTo18Precision(amount, token) {
  if (typeof token !== 'undefined' && token !== '') {
    const tokenSpecs = Dapple.getTokenSpecs(token);
    const precision = tokenSpecs !== undefined ? tokenSpecs.precision : 18;
    if (precision === 18) {
      return amount;
    }
    let value = amount;
    if (!(amount instanceof BigNumber)) {
      value = new BigNumber(amount);
    }
    return value.times(Math.pow(10, 18 - precision)).valueOf();
  } else {
    console.log('Token not found when converting');
    return false;
  }
}

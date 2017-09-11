/* eslint-disable */

import MatchingMarketABI from  './matching-market';
import ExpiringMarketABI from './expiring-market';
import SimpleMarketABI from './simple-market';

if (typeof Dapple === 'undefined') {
  Dapple = {};
}

Dapple['maker-otc'] = (function builder() {
  var environments = {
    'develop': {},
    'live': {
      'otc': {
        'value': '',
        'type': 'MatchingMarket',
      },
    },
    'kovan': {
      'otc': {
        'value': '',
        'type': 'MatchingMarket',
      },
    },
  };

  function ContractWrapper(headers, _web3) {
    if (!_web3) {
      throw new Error('Must supply a web3 connection!');
    }

    this.headers = headers;
    this._class = _web3.eth.contract(headers.interface);
  }

  ContractWrapper.prototype.deploy = function () {
    throw new Error('Module was built without any deploy data.');
  };

  ContractWrapper.prototype.new = function () {
    throw new Error('Module was built without any deploy data.');
  };

  var passthroughs = ['at'];
  for (var i = 0; i < passthroughs.length; i += 1) {
    ContractWrapper.prototype[passthroughs[i]] = (function (passthrough) {
      return function () {
        return this._class[passthrough].apply(this._class, arguments);
      };
    })(passthroughs[i]);
  }

  function constructor(_web3, env) {
    if (!env) {
      env = {
        'objects': {},
        'type': 'internal',
      };
    }
    if (!('objects' in env) && typeof env === 'object') {
      env = { objects: env };
    }
    while (typeof env !== 'object') {
      if (!(env in environments)) {
        throw new Error('Cannot resolve environment name: ' + env);
      }
      env = environments[env];
    }

    this.headers = {
      'MatchingMarket': MatchingMarketABI,
      'ExpiringMarket': ExpiringMarketABI,
      'SimpleMarket': SimpleMarketABI,
    };

    this.classes = {};
    for (var key in this.headers) {
      this.classes[key] = new ContractWrapper(this.headers[key], _web3);
    }

    this.objects = {};
    for (var i in env.objects) {
      var obj = env.objects[i];
      if (!(obj['type'].split('[')[0] in this.classes)) continue;
      this.objects[i] = this.classes[obj['type'].split('[')[0]].at(obj.value);
    }
  }

  return {
    class: constructor,
    environments: environments,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dapple['maker-otc'];
}

if (typeof Dapple === 'undefined') {
  Dapple = {};
}

if (typeof web3 === 'undefined' && typeof Web3 === 'undefined') {
  var Web3 = require('web3');
}

Dapple['maker-otc'] = (function builder () {
  var environments = {
      'develop': {},
      'live': {
        'otc': {
          'value': '0xc350ebf34b6d83b64ea0ee4e39b6ebe18f02ad2f',
          'type': 'ExpiringMarket[]'
        }
      },
      'kovan': {
        'otc': {
          'value': '0x5490ebdbABC74046855A3104095E71f19BE97f20',
          'type': 'ExpiringMarket[]'
        }
      }
    };

  function ContractWrapper (headers, _web3) {
    if (!_web3) {
      throw new Error('Must supply a Web3 connection!');
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

  function constructor (_web3, env) {
    if (!env) {
      env = {
      'objects': {},
      'type': 'internal'
    };
    }
    if(!("objects" in env) && typeof env === "object") {
      env = {objects: env};
    }
    while (typeof env !== 'object') {
      if (!(env in environments)) {
        throw new Error('Cannot resolve environment name: ' + env);
      }
      env = environments[env];
    }

    if (typeof _web3 === 'undefined') {
      if (!env.rpcURL) {
        throw new Error('Need either a Web3 instance or an RPC URL!');
      }
      _web3 = new Web3(new Web3.providers.HttpProvider(env.rpcURL));
    }

    this.headers = {
      'ExpiringMarket': {
        'interface': [
          {
            'constant': true,
            'inputs': [],
            'name': 'last_offer_id',
            'outputs': [
              {
                'name': '',
                'type': 'uint256'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'id',
                'type': 'uint256'
              }
            ],
            'name': 'cancel',
            'outputs': [
              {
                'name': 'success',
                'type': 'bool'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': 'id',
                'type': 'uint256'
              }
            ],
            'name': 'getOffer',
            'outputs': [
              {
                'name': '',
                'type': 'uint256'
              },
              {
                'name': '',
                'type': 'address'
              },
              {
                'name': '',
                'type': 'uint256'
              },
              {
                'name': '',
                'type': 'address'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': 'getTime',
            'outputs': [
              {
                'name': '',
                'type': 'uint256'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': 'close_time',
            'outputs': [
              {
                'name': '',
                'type': 'uint256'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': 'id',
                'type': 'uint256'
              }
            ],
            'name': 'isActive',
            'outputs': [
              {
                'name': 'active',
                'type': 'bool'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': '',
                'type': 'uint256'
              }
            ],
            'name': 'offers',
            'outputs': [
              {
                'name': 'sell_how_much',
                'type': 'uint256'
              },
              {
                'name': 'sell_which_token',
                'type': 'address'
              },
              {
                'name': 'buy_how_much',
                'type': 'uint256'
              },
              {
                'name': 'buy_which_token',
                'type': 'address'
              },
              {
                'name': 'owner',
                'type': 'address'
              },
              {
                'name': 'active',
                'type': 'bool'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': 'isClosed',
            'outputs': [
              {
                'name': 'closed',
                'type': 'bool'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': 'id',
                'type': 'uint256'
              }
            ],
            'name': 'getOwner',
            'outputs': [
              {
                'name': 'owner',
                'type': 'address'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'id',
                'type': 'uint256'
              },
              {
                'name': 'quantity',
                'type': 'uint256'
              }
            ],
            'name': 'buy',
            'outputs': [
              {
                'name': 'success',
                'type': 'bool'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'sell_how_much',
                'type': 'uint256'
              },
              {
                'name': 'sell_which_token',
                'type': 'address'
              },
              {
                'name': 'buy_how_much',
                'type': 'uint256'
              },
              {
                'name': 'buy_which_token',
                'type': 'address'
              }
            ],
            'name': 'offer',
            'outputs': [
              {
                'name': 'id',
                'type': 'uint256'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'inputs': [
              {
                'name': 'lifetime',
                'type': 'uint256'
              }
            ],
            'payable': false,
            'type': 'constructor'
          },
          {
            'payable': false,
            'type': 'fallback'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': false,
                'name': 'id',
                'type': 'uint256'
              }
            ],
            'name': 'ItemUpdate',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': false,
                'name': 'sell_how_much',
                'type': 'uint256'
              },
              {
                'indexed': true,
                'name': 'sell_which_token',
                'type': 'address'
              },
              {
                'indexed': false,
                'name': 'buy_how_much',
                'type': 'uint256'
              },
              {
                'indexed': true,
                'name': 'buy_which_token',
                'type': 'address'
              }
            ],
            'name': 'Trade',
            'type': 'event'
          }
        ]
      },
      'SimpleMarket': {
        'interface': [
          {
            'constant': true,
            'inputs': [],
            'name': 'last_offer_id',
            'outputs': [
              {
                'name': '',
                'type': 'uint256'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'id',
                'type': 'uint256'
              }
            ],
            'name': 'cancel',
            'outputs': [
              {
                'name': 'success',
                'type': 'bool'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': 'id',
                'type': 'uint256'
              }
            ],
            'name': 'getOffer',
            'outputs': [
              {
                'name': '',
                'type': 'uint256'
              },
              {
                'name': '',
                'type': 'address'
              },
              {
                'name': '',
                'type': 'uint256'
              },
              {
                'name': '',
                'type': 'address'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': 'id',
                'type': 'uint256'
              }
            ],
            'name': 'isActive',
            'outputs': [
              {
                'name': 'active',
                'type': 'bool'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': '',
                'type': 'uint256'
              }
            ],
            'name': 'offers',
            'outputs': [
              {
                'name': 'sell_how_much',
                'type': 'uint256'
              },
              {
                'name': 'sell_which_token',
                'type': 'address'
              },
              {
                'name': 'buy_how_much',
                'type': 'uint256'
              },
              {
                'name': 'buy_which_token',
                'type': 'address'
              },
              {
                'name': 'owner',
                'type': 'address'
              },
              {
                'name': 'active',
                'type': 'bool'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': 'id',
                'type': 'uint256'
              }
            ],
            'name': 'getOwner',
            'outputs': [
              {
                'name': 'owner',
                'type': 'address'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'id',
                'type': 'uint256'
              },
              {
                'name': 'quantity',
                'type': 'uint256'
              }
            ],
            'name': 'buy',
            'outputs': [
              {
                'name': 'success',
                'type': 'bool'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'sell_how_much',
                'type': 'uint256'
              },
              {
                'name': 'sell_which_token',
                'type': 'address'
              },
              {
                'name': 'buy_how_much',
                'type': 'uint256'
              },
              {
                'name': 'buy_which_token',
                'type': 'address'
              }
            ],
            'name': 'offer',
            'outputs': [
              {
                'name': 'id',
                'type': 'uint256'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'payable': false,
            'type': 'fallback'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': false,
                'name': 'id',
                'type': 'uint256'
              }
            ],
            'name': 'ItemUpdate',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': false,
                'name': 'sell_how_much',
                'type': 'uint256'
              },
              {
                'indexed': true,
                'name': 'sell_which_token',
                'type': 'address'
              },
              {
                'indexed': false,
                'name': 'buy_how_much',
                'type': 'uint256'
              },
              {
                'indexed': true,
                'name': 'buy_which_token',
                'type': 'address'
              }
            ],
            'name': 'Trade',
            'type': 'event'
          }
        ]
      }
    };

    this.classes = {};
    for (var key in this.headers) {
      this.classes[key] = new ContractWrapper(this.headers[key], _web3);
    }

    this.objects = {};
    for (var i in env.objects) {
      var obj = env.objects[i];
      if(!(obj['type'].split('[')[0] in this.classes)) continue;
      this.objects[i] = this.classes[obj['type'].split('[')[0]].at(obj.value);
    }
  }

  return {
    class: constructor,
    environments: environments
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dapple['maker-otc'];
}

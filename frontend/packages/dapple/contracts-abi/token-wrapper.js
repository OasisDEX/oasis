/* eslint-disable */

if (typeof Dapple === 'undefined') {
  Dapple = {};
}

Dapple['token-wrapper'] = (function builder() {
  var environments = {
    "internal": {}
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
        'type': 'internal'
      };
    }
    if (!("objects" in env) && typeof env === "object") {
      env = { objects: env };
    }
    while (typeof env !== 'object') {
      if (!(env in environments)) {
        throw new Error('Cannot resolve environment name: ' + env);
      }
      env = environments[env];
    }

    this.headers = {
      'DepositBroker': {
        'interface': [
          {
            'constant': false,
            'inputs': [],
            'name': 'clear',
            'outputs': [],
            'payable': false,
            'type': 'function'
          },
          {
            'inputs': [
              {
                'name': 'token',
                'type': 'address'
              }
            ],
            'payable': false,
            'type': 'constructor'
          }
        ]
      },
      'TokenWrapper': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'spender',
                'type': 'address'
              },
              {
                'name': 'value',
                'type': 'uint256'
              }
            ],
            'name': 'approve',
            'outputs': [
              {
                'name': 'ok',
                'type': 'bool'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': 'totalSupply',
            'outputs': [
              {
                'name': 'supply',
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
                'name': 'from',
                'type': 'address'
              },
              {
                'name': 'to',
                'type': 'address'
              },
              {
                'name': 'value',
                'type': 'uint256'
              }
            ],
            'name': 'transferFrom',
            'outputs': [
              {
                'name': 'ok',
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
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'name': 'withdraw',
            'outputs': [],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'name': 'notifyDeposit',
            'outputs': [],
            'payable': false,
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'createBroker',
            'outputs': [
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
                'name': 'who',
                'type': 'address'
              }
            ],
            'name': 'balanceOf',
            'outputs': [
              {
                'name': 'value',
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
                'name': 'to',
                'type': 'address'
              },
              {
                'name': 'value',
                'type': 'uint256'
              }
            ],
            'name': 'transfer',
            'outputs': [
              {
                'name': 'ok',
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
                'name': 'owner',
                'type': 'address'
              }
            ],
            'name': 'getBroker',
            'outputs': [
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
                'name': 'owner',
                'type': 'address'
              },
              {
                'name': 'spender',
                'type': 'address'
              }
            ],
            'name': 'allowance',
            'outputs': [
              {
                'name': '_allowance',
                'type': 'uint256'
              }
            ],
            'payable': false,
            'type': 'function'
          },
          {
            'inputs': [
              {
                'name': 'unwrapped',
                'type': 'address'
              }
            ],
            'payable': false,
            'type': 'constructor'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'broker',
                'type': 'address'
              }
            ],
            'name': 'LogBroker',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'from',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'to',
                'type': 'address'
              },
              {
                'indexed': false,
                'name': 'value',
                'type': 'uint256'
              }
            ],
            'name': 'Transfer',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'owner',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'spender',
                'type': 'address'
              },
              {
                'indexed': false,
                'name': 'value',
                'type': 'uint256'
              }
            ],
            'name': 'Approval',
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
      if (!(obj['type'].split('[')[0] in this.classes)) continue;
      this.objects[i] = this.classes[obj['type'].split('[')[0]].at(obj.value);
    }
  }

  return {
    class: constructor,
    environments: environments
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dapple['token-wrapper'];
}

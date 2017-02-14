'use strict';
/*
// For geth
if (typeof Dapple === 'undefined') {
  var Dapple = {};
}

// For browsers
if (typeof window !== 'undefined') {
  window.Dapple = Dapple;
}

// For Node
if (typeof web3 === 'undefined' && typeof Web3 === 'undefined') {
  var Web3 = require('web3');
}
*/
// Dappsys definition
Dapple['dappsys'] = (function builder () {
  var environments = {
    'ropsten': {
        'objects': {
          'auth_factory1': {
            'class': 'DSAuthFactory',
            'address': '0x0000000000000000000000000000000000000000'
          },
          'data_factory1': {
            'class': 'DSDataFactory',
            'address': '0x0000000000000000000000000000000000000000'
          },
          'multisig_factory1': {
            'class': 'DSMultisigFactory',
            'address': '0x0000000000000000000000000000000000000000'
          },
          'token_factory1': {
            'class': 'DSTokenFactory',
            'address': '0x0000000000000000000000000000000000000000'
          },
          'token_installer1': {
            'class': 'DSTokenInstaller',
            'address': '0x0000000000000000000000000000000000000000'
          },
          'factory1': {
            'class': 'DSFactory1',
            'address': '0x0000000000000000000000000000000000000000'
          },
          'eth_token1': {
            'class': 'DSEthToken',
            'address': '0x0000000000000000000000000000000000000000'
          },
          'token_registry': {
            'class': 'DSTokenRegistry',
            'address': '0x0000000000000000000000000000000000000000'
          },
          'multisig': {
            'class': 'DSEasyMultisig',
            'address': '0x0000000000000000000000000000000000000000'
          },
          'echo': {
            'class': 'DSEcho',
            'address': '0x0000000000000000000000000000000000000000'
          }
        }
      },
      'morden': {
        'objects': {
          'auth_factory1': {
            'class': 'DSAuthFactory',
            'address': '0x7639a37b8ecbd68e15b8e173897c6c0dea462452'
          },
          'data_factory1': {
            'class': 'DSDataFactory',
            'address': '0x619104fd4f8abdd2ee651f0ec4985719dbb2c599'
          },
          'multisig_factory1': {
            'class': 'DSMultisigFactory',
            'address': '0x0b30a24e7257e1842d681b0f2f8aff4182eb2a78'
          },
          'token_factory1': {
            'class': 'DSTokenFactory',
            'address': '0x9fc46bdfa075c2aad6437e9cc771e1bf6b72a9d4'
          },
          'token_installer1': {
            'class': 'DSTokenInstaller',
            'address': '0x5b605da3a721ba809be030d225312c4c39ead11b'
          },
          'factory1': {
            'class': 'DSFactory1',
            'address': '0x3da0d9695d0099f98582f58a64b2e2616fcbaa00'
          },
          'eth_token1': {
            'class': 'DSEthToken',
            'address': '0x52fe88b987c7829e5d5a61c98f67c9c14e6a7a90'
          },
          'token_registry': {
            'class': 'DSTokenRegistry',
            'address': '0x877c5369c747d24d9023c88c1aed1724f1993efe'
          },
          'multisig': {
            'class': 'DSEasyMultisig',
            'address': '0xcd85c33878a7f378483c6422eee32631ea6f8001'
          },
          'echo': {
            'class': 'DSEcho',
            'address': '0x002956c57c04f4b0469fa5cfa137a0b823e49293'
          }
        }
      },
      'live': {
        'objects': {
          'auth_factory1': {
            'class': 'DSAuthFactory',
            'address': '0x671bed5a8402cd6c250a17e5f02e08c85d51542f'
          },
          'data_factory1': {
            'class': 'DSDataFactory',
            'address': '0x5d7af7715dfbbfc86e2505c308468f78702a99d9'
          },
          'multisig_factory1': {
            'class': 'DSMultisigFactory',
            'address': '0x82f39d996d1e9ab119e4b33d581c3eeb4133acf6'
          },
          'token_factory1': {
            'class': 'DSTokenFactory',
            'address': '0x12bcc9daffda452b6c4b0a1571360925a64fcc79'
          },
          'token_installer1': {
            'class': 'DSTokenInstaller',
            'address': '0x460df00675f994928457771eb3b9732a99314cbe'
          },
          'factory1': {
            'class': 'DSFactory1',
            'address': '0x2c139c5a8dd6be98067c5b4258e0dedcdbbff78b'
          },
          'eth_token1': {
            'class': 'DSEthToken',
            'address': '0xecf8f87f810ecf450940c9f60066b4a7a501d6a7'
          },
          'token_registry': {
            'class': 'DSTokenRegistry',
            'address': '0xc6882fbffd309dc976dd6e4c79cc91e4c1482140'
          },
          'multisig': {
            'class': 'DSEasyMultisig',
            'address': '0xe02640be68df835aa3327ea6473c02c8f6c3815a'
          },
          'echo': {
            'class': 'DSEcho',
            'address': '0x992c64ac907ef9e531e7ff8d06cec599778a0e72'
          }
        }
      }
    };

  function constructor (_web3, env) {
    if (!env) {
      env = 'default';
    }
    while (typeof env !== 'object') {
      env = environments[env];
    }

    if (typeof _web3 === 'undefined') {
      if (!env.rpcURL) {
        throw new Error('Need either a Web3 instance or an RPC URL!');
      }
      _web3 = new Web3(new Web3.providers.HttpProvider(env.rpcURL));
    }
    this.web3 = _web3;

    this.headers = {
      'DSApprovalDB': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'holder',
                'type': 'address'
              },
              {
                'name': 'spender',
                'type': 'address'
              },
              {
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'name': 'setApproval',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_authority',
                'type': 'address'
              },
              {
                'name': 'mode',
                'type': 'uint8'
              }
            ],
            'name': 'updateAuthority',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'holder',
                'type': 'address'
              },
              {
                'name': 'spender',
                'type': 'address'
              }
            ],
            'name': 'getApproval',
            'outputs': [
              {
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_authority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_auth_mode',
            'outputs': [
              {
                'name': '',
                'type': 'uint8'
              }
            ],
            'type': 'function'
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
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
            'type': 'event'
          }
        ]
      },
      'DSApprovalDBEvents': {
        'interface': [
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
      },
      'DSAuth': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_authority',
                'type': 'address'
              },
              {
                'name': 'mode',
                'type': 'uint8'
              }
            ],
            'name': 'updateAuthority',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_authority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_auth_mode',
            'outputs': [
              {
                'name': '',
                'type': 'uint8'
              }
            ],
            'type': 'function'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
            'type': 'event'
          }
        ]
      },
      'DSAuthFactory': {
        'interface': [
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSBasicAuthority',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          }
        ]
      },
      'DSAuthority': {
        'interface': [
          {
            'constant': true,
            'inputs': [
              {
                'name': 'caller',
                'type': 'address'
              },
              {
                'name': 'callee',
                'type': 'address'
              },
              {
                'name': 'sig',
                'type': 'bytes4'
              }
            ],
            'name': 'canCall',
            'outputs': [
              {
                'name': '',
                'type': 'bool'
              }
            ],
            'type': 'function'
          }
        ]
      },
      'DSAuthorized': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_authority',
                'type': 'address'
              },
              {
                'name': 'mode',
                'type': 'uint8'
              }
            ],
            'name': 'updateAuthority',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_authority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_auth_mode',
            'outputs': [
              {
                'name': '',
                'type': 'uint8'
              }
            ],
            'type': 'function'
          },
          {
            'inputs': [],
            'type': 'constructor'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
            'type': 'event'
          }
        ]
      },
      'DSAuthorizedEvents': {
        'interface': [
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
            'type': 'event'
          }
        ]
      },
      'DSAuthorizedUser': {
        'interface': [
          {
            'constant': false,
            'inputs': [],
            'name': 'triggerAuth',
            'outputs': [
              {
                'name': '',
                'type': 'bool'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'triggerTryAuth',
            'outputs': [
              {
                'name': '',
                'type': 'bool'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_authority',
                'type': 'address'
              },
              {
                'name': 'mode',
                'type': 'uint8'
              }
            ],
            'name': 'updateAuthority',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_authority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_auth_mode',
            'outputs': [
              {
                'name': '',
                'type': 'uint8'
              }
            ],
            'type': 'function'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
            'type': 'event'
          }
        ]
      },
      'DSBalanceDB': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'to',
                'type': 'address'
              },
              {
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'name': 'addBalance',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': 'getSupply',
            'outputs': [
              {
                'name': '',
                'type': 'uint256'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_authority',
                'type': 'address'
              },
              {
                'name': 'mode',
                'type': 'uint8'
              }
            ],
            'name': 'updateAuthority',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_authority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
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
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'name': 'subBalance',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_auth_mode',
            'outputs': [
              {
                'name': '',
                'type': 'uint8'
              }
            ],
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
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'name': 'moveBalance',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'who',
                'type': 'address'
              },
              {
                'name': 'new_balance',
                'type': 'uint256'
              }
            ],
            'name': 'setBalance',
            'outputs': [],
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
            'name': 'getBalance',
            'outputs': [
              {
                'name': '',
                'type': 'uint256'
              }
            ],
            'type': 'function'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'who',
                'type': 'address'
              },
              {
                'indexed': false,
                'name': 'new_amount',
                'type': 'uint256'
              }
            ],
            'name': 'BalanceUpdate',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
            'type': 'event'
          }
        ]
      },
      'DSBalanceDBEvents': {
        'interface': [
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'who',
                'type': 'address'
              },
              {
                'indexed': false,
                'name': 'new_amount',
                'type': 'uint256'
              }
            ],
            'name': 'BalanceUpdate',
            'type': 'event'
          }
        ]
      },
      'DSBasicAuthority': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'caller_address',
                'type': 'address'
              },
              {
                'name': 'code_address',
                'type': 'address'
              },
              {
                'name': 'signature',
                'type': 'string'
              },
              {
                'name': 'can',
                'type': 'bool'
              }
            ],
            'name': 'setCanCall',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_authority',
                'type': 'address'
              },
              {
                'name': 'mode',
                'type': 'uint8'
              }
            ],
            'name': 'updateAuthority',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'caller_address',
                'type': 'address'
              },
              {
                'name': 'code_address',
                'type': 'address'
              },
              {
                'name': 'sig',
                'type': 'bytes4'
              },
              {
                'name': 'can',
                'type': 'bool'
              }
            ],
            'name': 'setCanCall',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': 'caller_address',
                'type': 'address'
              },
              {
                'name': 'code_address',
                'type': 'address'
              },
              {
                'name': 'sig',
                'type': 'bytes4'
              }
            ],
            'name': 'canCall',
            'outputs': [
              {
                'name': '',
                'type': 'bool'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_authority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_auth_mode',
            'outputs': [
              {
                'name': '',
                'type': 'uint8'
              }
            ],
            'type': 'function'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': false,
                'name': 'caller_address',
                'type': 'address'
              },
              {
                'indexed': false,
                'name': 'code_address',
                'type': 'address'
              },
              {
                'indexed': false,
                'name': 'sig',
                'type': 'bytes4'
              },
              {
                'indexed': false,
                'name': 'can',
                'type': 'bool'
              }
            ],
            'name': 'DSSetCanCall',
            'type': 'event'
          }
        ]
      },
      'DSBasicAuthorityEvents': {
        'interface': [
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': false,
                'name': 'caller_address',
                'type': 'address'
              },
              {
                'indexed': false,
                'name': 'code_address',
                'type': 'address'
              },
              {
                'indexed': false,
                'name': 'sig',
                'type': 'bytes4'
              },
              {
                'indexed': false,
                'name': 'can',
                'type': 'bool'
              }
            ],
            'name': 'DSSetCanCall',
            'type': 'event'
          }
        ]
      },
      'DSDataFactory': {
        'interface': [
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSMap',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSBalanceDB',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSApprovalDB',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSNullMap',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          }
        ]
      },
      'DSEasyMultisig': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'target',
                'type': 'address'
              },
              {
                'name': 'calldata',
                'type': 'bytes'
              },
              {
                'name': 'value',
                'type': 'uint256'
              }
            ],
            'name': 'propose',
            'outputs': [
              {
                'name': 'action_id',
                'type': 'uint256'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': 'getInfo',
            'outputs': [
              {
                'name': 'required',
                'type': 'uint256'
              },
              {
                'name': 'members',
                'type': 'uint256'
              },
              {
                'name': 'expiration',
                'type': 'uint256'
              },
              {
                'name': 'last_proposed_action',
                'type': 'uint256'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_authority',
                'type': 'address'
              },
              {
                'name': 'mode',
                'type': 'uint8'
              }
            ],
            'name': 'updateAuthority',
            'outputs': [],
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
            'name': 'isMember',
            'outputs': [
              {
                'name': '',
                'type': 'bool'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'action_id',
                'type': 'uint256'
              }
            ],
            'name': 'confirm',
            'outputs': [
              {
                'name': 'confirmed',
                'type': 'bool'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_authority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'target',
                'type': 'address'
              },
              {
                'name': 'value',
                'type': 'uint256'
              }
            ],
            'name': 'easyPropose',
            'outputs': [
              {
                'name': 'action_id',
                'type': 'uint256'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'who',
                'type': 'address'
              }
            ],
            'name': 'addMember',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_auth_mode',
            'outputs': [
              {
                'name': '',
                'type': 'uint8'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'action_id',
                'type': 'uint256'
              }
            ],
            'name': 'trigger',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': 'action_id',
                'type': 'uint256'
              }
            ],
            'name': 'getActionStatus',
            'outputs': [
              {
                'name': 'confirmations',
                'type': 'uint256'
              },
              {
                'name': 'expiration',
                'type': 'uint256'
              },
              {
                'name': 'triggered',
                'type': 'bool'
              }
            ],
            'type': 'function'
          },
          {
            'inputs': [
              {
                'name': 'required',
                'type': 'uint256'
              },
              {
                'name': 'member_count',
                'type': 'uint256'
              },
              {
                'name': 'expiration',
                'type': 'uint256'
              }
            ],
            'type': 'constructor'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': false,
                'name': 'who',
                'type': 'address'
              }
            ],
            'name': 'MemberAdded',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'action_id',
                'type': 'uint256'
              },
              {
                'indexed': false,
                'name': 'calldata',
                'type': 'bytes'
              }
            ],
            'name': 'Proposed',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'action_id',
                'type': 'uint256'
              },
              {
                'indexed': false,
                'name': 'who',
                'type': 'address'
              }
            ],
            'name': 'Confirmed',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'action_id',
                'type': 'uint256'
              }
            ],
            'name': 'Triggered',
            'type': 'event'
          }
        ]
      },
      'DSEasyMultisigEvents': {
        'interface': [
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': false,
                'name': 'who',
                'type': 'address'
              }
            ],
            'name': 'MemberAdded',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'action_id',
                'type': 'uint256'
              },
              {
                'indexed': false,
                'name': 'calldata',
                'type': 'bytes'
              }
            ],
            'name': 'Proposed',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'action_id',
                'type': 'uint256'
              },
              {
                'indexed': false,
                'name': 'who',
                'type': 'address'
              }
            ],
            'name': 'Confirmed',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'action_id',
                'type': 'uint256'
              }
            ],
            'name': 'Triggered',
            'type': 'event'
          }
        ]
      },
      'DSEthToken': {
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
            'outputs': [
              {
                'name': 'ok',
                'type': 'bool'
              }
            ],
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
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'deposit',
            'outputs': [
              {
                'name': 'ok',
                'type': 'bool'
              }
            ],
            'type': 'function',
            'payable': true
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
            'type': 'function'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'who',
                'type': 'address'
              },
              {
                'indexed': false,
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'name': 'Deposit',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'who',
                'type': 'address'
              },
              {
                'indexed': false,
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'name': 'Withdrawal',
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
      },
      'DSEthTokenEvents': {
        'interface': [
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'who',
                'type': 'address'
              },
              {
                'indexed': false,
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'name': 'Deposit',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'who',
                'type': 'address'
              },
              {
                'indexed': false,
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'name': 'Withdrawal',
            'type': 'event'
          }
        ]
      },
      'DSFactory': {
        'interface': [
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSMap',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'n',
                'type': 'uint256'
              },
              {
                'name': 'm',
                'type': 'uint256'
              },
              {
                'name': 'expiration',
                'type': 'uint256'
              }
            ],
            'name': 'buildDSEasyMultisig',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSTokenFrontend',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'frontend',
                'type': 'address'
              },
              {
                'name': 'bal_db',
                'type': 'address'
              },
              {
                'name': 'appr_db',
                'type': 'address'
              }
            ],
            'name': 'buildDSTokenController',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSBasicAuthority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSBalanceDB',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSTokenRegistry',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSApprovalDB',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'authority',
                'type': 'address'
              }
            ],
            'name': 'installDSTokenBasicSystem',
            'outputs': [
              {
                'name': 'token_frontend',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSNullMap',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          }
        ]
      },
      'DSFactory1': {
        'interface': [
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSMap',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'n',
                'type': 'uint256'
              },
              {
                'name': 'm',
                'type': 'uint256'
              },
              {
                'name': 'expiration',
                'type': 'uint256'
              }
            ],
            'name': 'buildDSEasyMultisig',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSTokenFrontend',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'frontend',
                'type': 'address'
              },
              {
                'name': 'bal_db',
                'type': 'address'
              },
              {
                'name': 'appr_db',
                'type': 'address'
              }
            ],
            'name': 'buildDSTokenController',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSBasicAuthority',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSBalanceDB',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSTokenRegistry',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSApprovalDB',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'authority',
                'type': 'address'
              }
            ],
            'name': 'installDSTokenBasicSystem',
            'outputs': [
              {
                'name': 'frontend',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSNullMap',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'inputs': [
              {
                'name': 'auth',
                'type': 'address'
              },
              {
                'name': 'data',
                'type': 'address'
              },
              {
                'name': 'ms',
                'type': 'address'
              },
              {
                'name': 'token',
                'type': 'address'
              },
              {
                'name': 'token_install',
                'type': 'address'
              }
            ],
            'type': 'constructor'
          }
        ]
      },
      'DSFactory1Morden': {
        'interface': [
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSMap',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'n',
                'type': 'uint256'
              },
              {
                'name': 'm',
                'type': 'uint256'
              },
              {
                'name': 'expiration',
                'type': 'uint256'
              }
            ],
            'name': 'buildDSEasyMultisig',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSTokenFrontend',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'frontend',
                'type': 'address'
              },
              {
                'name': 'bal_db',
                'type': 'address'
              },
              {
                'name': 'appr_db',
                'type': 'address'
              }
            ],
            'name': 'buildDSTokenController',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSBasicAuthority',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSBalanceDB',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSTokenRegistry',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSApprovalDB',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'authority',
                'type': 'address'
              }
            ],
            'name': 'installDSTokenBasicSystem',
            'outputs': [
              {
                'name': 'frontend',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSNullMap',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          }
        ]
      },
      'DSFactoryUser': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'f',
                'type': 'address'
              }
            ],
            'name': 'FactoryUser',
            'outputs': [],
            'type': 'function'
          }
        ]
      },
      'DSMap': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_authority',
                'type': 'address'
              },
              {
                'name': 'mode',
                'type': 'uint8'
              }
            ],
            'name': 'updateAuthority',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': 'key',
                'type': 'bytes32'
              }
            ],
            'name': 'get',
            'outputs': [
              {
                'name': 'value',
                'type': 'bytes32'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_authority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_auth_mode',
            'outputs': [
              {
                'name': '',
                'type': 'uint8'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'key',
                'type': 'bytes32'
              },
              {
                'name': 'value',
                'type': 'bytes32'
              }
            ],
            'name': 'set',
            'outputs': [],
            'type': 'function'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'key',
                'type': 'bytes32'
              },
              {
                'indexed': true,
                'name': 'value',
                'type': 'bytes32'
              }
            ],
            'name': 'Set',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
            'type': 'event'
          }
        ]
      },
      'DSMapEvents': {
        'interface': [
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'key',
                'type': 'bytes32'
              },
              {
                'indexed': true,
                'name': 'value',
                'type': 'bytes32'
              }
            ],
            'name': 'Set',
            'type': 'event'
          }
        ]
      },
      'DSMultisigFactory': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'n',
                'type': 'uint256'
              },
              {
                'name': 'm',
                'type': 'uint256'
              },
              {
                'name': 'expiration',
                'type': 'uint256'
              }
            ],
            'name': 'buildDSEasyMultisig',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          }
        ]
      },
      'DSNullMap': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_authority',
                'type': 'address'
              },
              {
                'name': 'mode',
                'type': 'uint8'
              }
            ],
            'name': 'updateAuthority',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': 'key',
                'type': 'bytes32'
              }
            ],
            'name': 'get',
            'outputs': [
              {
                'name': 'value',
                'type': 'bytes32'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'key',
                'type': 'bytes32'
              }
            ],
            'name': 'unset',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_authority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_auth_mode',
            'outputs': [
              {
                'name': '',
                'type': 'uint8'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': 'key',
                'type': 'bytes32'
              }
            ],
            'name': 'tryGet',
            'outputs': [
              {
                'name': 'value',
                'type': 'bytes32'
              },
              {
                'name': 'ok',
                'type': 'bool'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'key',
                'type': 'bytes32'
              },
              {
                'name': 'value',
                'type': 'bytes32'
              }
            ],
            'name': 'set',
            'outputs': [],
            'type': 'function'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'key',
                'type': 'bytes32'
              },
              {
                'indexed': true,
                'name': 'value',
                'type': 'bytes32'
              },
              {
                'indexed': true,
                'name': 'is_set',
                'type': 'bool'
              }
            ],
            'name': 'SetNullable',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
            'type': 'event'
          }
        ]
      },
      'DSNullMapEvents': {
        'interface': [
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'key',
                'type': 'bytes32'
              },
              {
                'indexed': true,
                'name': 'value',
                'type': 'bytes32'
              },
              {
                'indexed': true,
                'name': 'is_set',
                'type': 'bool'
              }
            ],
            'name': 'SetNullable',
            'type': 'event'
          }
        ]
      },
      'DSSimpleActor': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'target',
                'type': 'address'
              },
              {
                'name': 'calldata',
                'type': 'bytes'
              },
              {
                'name': 'value',
                'type': 'uint256'
              }
            ],
            'name': 'tryExecute',
            'outputs': [
              {
                'name': 'call_ret',
                'type': 'bool'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'target',
                'type': 'address'
              },
              {
                'name': 'calldata',
                'type': 'bytes'
              },
              {
                'name': 'value',
                'type': 'uint256'
              }
            ],
            'name': 'execute',
            'outputs': [],
            'type': 'function'
          }
        ]
      },
      'DSToken': {
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
            'type': 'function'
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
      },
      'DSTokenBase': {
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
            'type': 'function'
          },
          {
            'inputs': [
              {
                'name': 'initial_balance',
                'type': 'uint256'
              }
            ],
            'type': 'constructor'
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
      },
      'DSTokenController': {
        'interface': [
          {
            'constant': true,
            'inputs': [],
            'name': 'getFrontend',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': '_caller',
                'type': 'address'
              },
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
                'name': '',
                'type': 'bool'
              }
            ],
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
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'frontend',
                'type': 'address'
              }
            ],
            'name': 'setFrontend',
            'outputs': [],
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
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_authority',
                'type': 'address'
              },
              {
                'name': 'mode',
                'type': 'uint8'
              }
            ],
            'name': 'updateAuthority',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_db',
                'type': 'address'
              }
            ],
            'name': 'setBalanceDB',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': 'getBalanceDB',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': '_caller',
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
            'name': 'transfer',
            'outputs': [
              {
                'name': 'ok',
                'type': 'bool'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_authority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_db',
                'type': 'address'
              }
            ],
            'name': 'setApprovalDB',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_auth_mode',
            'outputs': [
              {
                'name': '',
                'type': 'uint8'
              }
            ],
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
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': '_caller',
                'type': 'address'
              },
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
                'name': '',
                'type': 'bool'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': 'getApprovalDB',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'inputs': [
              {
                'name': 'frontend',
                'type': 'address'
              },
              {
                'name': 'baldb',
                'type': 'address'
              },
              {
                'name': 'apprdb',
                'type': 'address'
              }
            ],
            'type': 'constructor'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
            'type': 'event'
          }
        ]
      },
      'DSTokenControllerType': {
        'interface': [
          {
            'constant': true,
            'inputs': [],
            'name': 'getFrontend',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': '_caller',
                'type': 'address'
              },
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
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'frontend',
                'type': 'address'
              }
            ],
            'name': 'setFrontend',
            'outputs': [],
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
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_db',
                'type': 'address'
              }
            ],
            'name': 'setBalanceDB',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': 'getBalanceDB',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': '_caller',
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
            'name': 'transfer',
            'outputs': [
              {
                'name': 'ok',
                'type': 'bool'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_db',
                'type': 'address'
              }
            ],
            'name': 'setApprovalDB',
            'outputs': [],
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
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': '_caller',
                'type': 'address'
              },
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
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': 'getApprovalDB',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          }
        ]
      },
      'DSTokenEventCallback': {
        'interface': [
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
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'name': 'emitTransfer',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'holder',
                'type': 'address'
              },
              {
                'name': 'spender',
                'type': 'address'
              },
              {
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'name': 'emitApproval',
            'outputs': [],
            'type': 'function'
          }
        ]
      },
      'DSTokenFactory': {
        'interface': [
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSTokenFrontend',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'frontend',
                'type': 'address'
              },
              {
                'name': 'bal_db',
                'type': 'address'
              },
              {
                'name': 'appr_db',
                'type': 'address'
              }
            ],
            'name': 'buildDSTokenController',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'buildDSTokenRegistry',
            'outputs': [
              {
                'name': 'ret',
                'type': 'address'
              }
            ],
            'type': 'function'
          }
        ]
      },
      'DSTokenFrontend': {
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
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'name': 'emitTransfer',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': 'getController',
            'outputs': [
              {
                'name': 'controller',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'holder',
                'type': 'address'
              },
              {
                'name': 'spender',
                'type': 'address'
              },
              {
                'name': 'amount',
                'type': 'uint256'
              }
            ],
            'name': 'emitApproval',
            'outputs': [],
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
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_authority',
                'type': 'address'
              },
              {
                'name': 'mode',
                'type': 'uint8'
              }
            ],
            'name': 'updateAuthority',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'controller',
                'type': 'address'
              }
            ],
            'name': 'setController',
            'outputs': [],
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
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_authority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_auth_mode',
            'outputs': [
              {
                'name': '',
                'type': 'uint8'
              }
            ],
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
            'type': 'function'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
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
      },
      'DSTokenInstaller': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'authority',
                'type': 'address'
              }
            ],
            'name': 'installDSTokenBasicSystem',
            'outputs': [
              {
                'name': 'frontend',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'inputs': [
              {
                'name': 'auth',
                'type': 'address'
              },
              {
                'name': 'data',
                'type': 'address'
              },
              {
                'name': 'token',
                'type': 'address'
              }
            ],
            'type': 'constructor'
          }
        ]
      },
      'DSTokenInstallerMorden': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'authority',
                'type': 'address'
              }
            ],
            'name': 'installDSTokenBasicSystem',
            'outputs': [
              {
                'name': 'frontend',
                'type': 'address'
              }
            ],
            'type': 'function'
          }
        ]
      },
      'DSTokenProvider': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'symbol',
                'type': 'bytes32'
              }
            ],
            'name': 'getToken',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          }
        ]
      },
      'DSTokenRegistry': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'symbol',
                'type': 'bytes32'
              }
            ],
            'name': 'getToken',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_authority',
                'type': 'address'
              },
              {
                'name': 'mode',
                'type': 'uint8'
              }
            ],
            'name': 'updateAuthority',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': 'key',
                'type': 'bytes32'
              }
            ],
            'name': 'get',
            'outputs': [
              {
                'name': 'value',
                'type': 'bytes32'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'key',
                'type': 'bytes32'
              }
            ],
            'name': 'unset',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_authority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_auth_mode',
            'outputs': [
              {
                'name': '',
                'type': 'uint8'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': 'key',
                'type': 'bytes32'
              }
            ],
            'name': 'tryGet',
            'outputs': [
              {
                'name': 'value',
                'type': 'bytes32'
              },
              {
                'name': 'ok',
                'type': 'bool'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'key',
                'type': 'bytes32'
              },
              {
                'name': 'value',
                'type': 'bytes32'
              }
            ],
            'name': 'set',
            'outputs': [],
            'type': 'function'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'key',
                'type': 'bytes32'
              },
              {
                'indexed': true,
                'name': 'value',
                'type': 'bytes32'
              },
              {
                'indexed': true,
                'name': 'is_set',
                'type': 'bool'
              }
            ],
            'name': 'SetNullable',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
            'type': 'event'
          }
        ]
      },
      'ERC20': {
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
            'type': 'function'
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
      },
      'ERC20Events': {
        'interface': [
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
      },
      'ERC20Stateful': {
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
            'type': 'function'
          }
        ]
      },
      'ERC20Stateless': {
        'interface': [
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
            'type': 'function'
          }
        ]
      },
      'FallbackUser': {
        'interface': [
          {
            'constant': false,
            'inputs': [],
            'name': 'exec',
            'outputs': [
              {
                'name': '',
                'type': 'bool'
              }
            ],
            'type': 'function'
          }
        ]
      },
      'Vault': {
        'interface': [
          {
            'constant': false,
            'inputs': [],
            'name': 'breach',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': 'coins',
            'outputs': [
              {
                'name': '',
                'type': 'uint256'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_authority',
                'type': 'address'
              },
              {
                'name': 'mode',
                'type': 'uint8'
              }
            ],
            'name': 'updateAuthority',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': 'breached',
            'outputs': [
              {
                'name': '',
                'type': 'bool'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_authority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_auth_mode',
            'outputs': [
              {
                'name': '',
                'type': 'uint8'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [],
            'name': 'reset',
            'outputs': [],
            'type': 'function'
          },
          {
            'inputs': [],
            'type': 'constructor'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
            'type': 'event'
          },
        ]
      },
      'DSEcho': {
        'interface': [],
      }
    };

    this.classes = {};
    for (var key in this.headers) {
      this.classes[key] = _web3.eth.contract(this.headers[key].interface);
    }

    this.objects = {};
    for (var i in env.objects) {
      var obj = env.objects[i];
      this.objects[i] = this.classes[obj['class']].at(obj.address);
      this.objects[i].abi = this.classes[obj['class']].abi;
    }

    this.environment = env;
  }

  return {
    class: constructor,
    environments: environments
  };
})();

Dapple['Maker'] = (function builder () {
  function sanitize (web3, opts, cb) {
    var defaultOpts = {
      from: web3.eth.defaultAccount || web3.eth.coinbase
    };

    if (typeof opts === 'function') {
      cb = opts;
      opts = defaultOpts;
    }
    if (typeof opts === 'undefined') {
      opts = defaultOpts;
    }
    if (typeof cb === 'undefined') {
      cb = function () {};
    }

    if (!opts.gas) {
      opts.gas = web3.eth.estimateGas(opts);
    }

    return {opts: opts, cb: cb};
  }

  var MakerAdmin = function (maker) {
    this._maker = maker;
    this._dappsys = maker.dappsys;
    this._web3 = maker.dappsys.web3;
    this._multisig = maker.dappsys.objects.multisig;

    this.ActionProposed = this._multisig.Proposed.bind(this._multisig);
    this.ActionConfirmed = this._multisig.Confirmed.bind(this._multisig);
    this.ActionTriggered = this._multisig.Triggered.bind(this._multisig);
  };

  MakerAdmin.prototype.proposeAction = function (
      contract, func, args, value, opts, cb) {
    var sanitized = sanitize(this._web3, opts, cb);
    opts = sanitized.opts;
    cb = sanitized.cb;

    if (typeof contract === 'string') {
      contract = this._stringToContract(contract);
    }

    var proposalData = this._constructProposalData(contract, func, args);

    var filter = this._multisig.Proposed(
        {calldata: proposalData},
        function (err, evt) {
          filter.stopWatching();
          if (err) return cb(err);
          cb(null, evt.args.action_id);
        });

    return this._multisig.propose(contract.address, proposalData, value, opts);
  };

  MakerAdmin.prototype.confirmAction = function (actionID, opts, cb) {
    return this._doAction('confirm', actionID, opts, cb);
  };

  MakerAdmin.prototype.triggerAction = function (actionID, opts, cb) {
    return this._doAction('trigger', actionID, opts, cb);
  };

  MakerAdmin.prototype.verifyAction = function (
      actionID, contract, func, args, value, cb) {
    var that = this;
    if (typeof contract === 'string') {
      contract = this._stringToContract(contract);
    }

    var proposalData = this._constructProposalData(contract, func, args);

    // Check the last 10000 blocks for a proposal with the given action ID,
    // which should cover one whole voting round with some room to spare.
    var lookback = 10000;

    function compareTxData (err, tx) {
      if (err) {
        return cb(err);
      }
      var expectedData = that._getData(
          that._multisig, 'propose', [contract.address, proposalData, value]);
      var res = {
        actionID: actionID,
        actualData: tx.input,
        expectedData: expectedData
      };
      res.verified = (res.actualData === res.expectedData);
      res.message = (res.verified ?
          'Passes verification. Should be safe to confirm.' :
          'Does NOT pass verification! Do NOT confirm!');
      return cb(null, res);
    }

    that._web3.eth.getBlockNumber(function (err, latestBN) {
      if (err) {
        return cb(err);
      }
      that.ActionProposed(
        {action_id: actionID},
        {fromBlock: latestBN - lookback, toBlock: latestBN})
      .get(function (err, logs) {
        if (err) {
          return cb(err);
        }
        if (logs.length === 0) {
          return cb('Could not find action proposal with ID ' + actionID +
                    ' in the last ' + lookback + ' blocks!');
        }

        that._web3.eth.getTransaction(
          logs[0].transactionHash, compareTxData);
      });
    })
  };

  MakerAdmin.prototype.actionStatus = function (actionID) {
    var statusArray = this._multisig.getActionStatus(actionID);
    return {
      'confirmations': statusArray[0],
      'expiration': new Date(statusArray[1] * 1000),
      'triggered': statusArray[2]
    };
  };

  MakerAdmin.prototype.getInfo = function () {
    var info = this._multisig.getInfo();
    return {
      'quorum': info[0],
      'members': info[1],
      'votingPeriod': info[2],
      'lastActionID': info[3]
    };
  };

  MakerAdmin.prototype.isAdmin = function (address) {
    if (typeof address === 'undefined') {
      address = this._web3.eth.defaultAccount || this._web3.eth.coinbase;
    }
    return this._multisig.isMember.call(address);
  };

  MakerAdmin.prototype._stringToContract = function (contractName) {
    if (!(contract in this._dappsys.objects)) {
      throw new Error('Unrecognized contract name: ' + contract);
    }
    return this._dappsys.objects[contract];
  };

  MakerAdmin.prototype._constructProposalData = function (
      contract, func, args) {
    if (!(func in contract)) {
      throw new Error('Unrecognized function name: ' + func);
    }

    return this._getData(contract, func, args);
  }

  MakerAdmin.prototype._getData = function (contract, func, args) {
    if (!(func in contract)) {
      throw new Error(func + ' function not found in contract!');
    }
    if (contract[func].getData) {
      return contract[func].getData.apply(contract, args);
    }

    var targetABI = JSON.parse(JSON.stringify(contract.abi));

    for (var i = 0; i < targetABI.length; i += 1) {
      if (targetABI[i].type !== 'function') continue;
      targetABI[i].outputs = [{'name': '', 'type': 'bytes'}];
    }

    var echoer = this._dappsys.web3.eth.contract(targetABI)
                     .at(this._dappsys.objects.echo.address);

    return echoer[func].call.apply(echoer, args);
  };

  MakerAdmin.prototype._doAction = function (verb, actionID, opts, cb) {
    var sanitized = sanitize(this._web3, opts, cb);
    opts = sanitized.opts;
    cb = sanitized.cb;

    var that = this;
    var filter = this._web3.eth.filter('latest', function (err, block) {
      if (err) {
        filter.stopWatching();
        return cb(err);
      }

      that._web3.eth.getTransactionReceipt(txID, function (err, receipt) {
        if (err) {
          filter.stopWatching();
          return cb(err);
        }

        if (receipt.blockNumber) {
          filter.stopWatching();

          if (receipt.logs.length === 0) {
            return cb('Exception was thrown in multisig contract. ' +
                      'Did you send from your admin multisig address?' +
                      'Have you already ' + verb + 'ed this action?');
          }
          return cb(null, actionID);
        }
      });
    });

    var txID = this._multisig[verb](actionID, opts);
    return txID;
  };

  var Maker = function (_web3, environment) {
    if (typeof web3 === 'undefined') {
      if (typeof _web3 !== 'undefined') {
        var web3 = _web3;
      } else if (typeof Web3 !== 'undefined') {
        var web3 = new Web3(new HttpProvider('http://localhost/', '8545'));
      }
    }

    this._web3 = web3;
    this.dappsys = new Dapple.dappsys.class(web3, environment);
    this.admin = new MakerAdmin(this);
  };

  Maker.prototype.getToken = function (symbol, callback) {
    var tokenClass = 'DSTokenFrontend';
    if (symbol === 'W-ETH') {
      tokenClass = 'DSEthToken';
    }
    var _this = this
    _this.dappsys.objects.token_registry.get(symbol, function (error, n) {
      if (!error) {
        try {
          _this.dappsys.classes[tokenClass].at(_this._web3.toHex(_this._web3.toBigNumber(n)), function (error, token) {
            if (!error) {
              token.abi = _this.dappsys.classes[tokenClass].abi;
              callback(error, token)
            } else {
              callback(error, token)
            }
          })
        } catch (e) {
          callback(e, null)
        }
      } else {
        callback(error, n)
      }
    })
  };

  // Helper functions for logging callback arguments.
  Maker.prototype.logCB = function () {
    console.log(JSON.stringify(arguments));
  };

  Maker.prototype.logAction = function (err, actionID) {
    if (err) {
      console.log('ERROR: Action #' + actionID + ': ' + err);
    } else {
      console.log('Action ID: ' + actionID);
    }
  };

  Maker.prototype.logVerification = function (err, response) {
    if (err) {
      console.log('ERROR: ' + err);
    } else {
      console.log('Action #' + response.actionID + ' verification result: ' +
          response.message);
    }
  };

  return Maker;
})();
/*
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dapple['dappsys'];
}
*/
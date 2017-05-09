/* eslint-disable */

// For geth
if (typeof Dapple === 'undefined') {
  Dapple = {};
}

Dapple['ds-eth-token'] = (function builder() {
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
    // var args = new Array(arguments);
    // args[args.length - 1].data = this.headers.bytecode;
    // return this._class.new.apply(this._class, args);
    arguments[arguments.length - 1].data = this.headers.bytecode;
    return this._class.new.apply(this._class, arguments);
  };

  var passthroughs = ['at', 'new'];
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
        "objects": {},
        "type": "internal"
      };
    }
    if (typeof env === "object" && !("objects" in env)) {
      env = { objects: env };
    }
    while (typeof env !== 'object') {
      if (!(env in environments)) {
        throw new Error('Cannot resolve environment name: ' + env);
      }
      env = { objects: environments[env] };
    }

    this.headers = {
      "DSEthToken": {
        "interface": [
          {
            "constant": true,
            "inputs": [],
            "name": "name",
            "outputs": [
              {
                "name": "",
                "type": "string"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": false,
            "inputs": [
              {
                "name": "guy",
                "type": "address"
              },
              {
                "name": "wad",
                "type": "uint256"
              }
            ],
            "name": "approve",
            "outputs": [
              {
                "name": "",
                "type": "bool"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "totalSupply",
            "outputs": [
              {
                "name": "supply",
                "type": "uint256"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": false,
            "inputs": [
              {
                "name": "src",
                "type": "address"
              },
              {
                "name": "dst",
                "type": "address"
              },
              {
                "name": "wad",
                "type": "uint256"
              }
            ],
            "name": "transferFrom",
            "outputs": [
              {
                "name": "",
                "type": "bool"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": false,
            "inputs": [
              {
                "name": "amount",
                "type": "uint256"
              }
            ],
            "name": "withdraw",
            "outputs": [],
            "payable": false,
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [
              {
                "name": "",
                "type": "uint256"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [
              {
                "name": "src",
                "type": "address"
              }
            ],
            "name": "balanceOf",
            "outputs": [
              {
                "name": "",
                "type": "uint256"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "symbol",
            "outputs": [
              {
                "name": "",
                "type": "string"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": false,
            "inputs": [
              {
                "name": "dst",
                "type": "address"
              },
              {
                "name": "wad",
                "type": "uint256"
              }
            ],
            "name": "transfer",
            "outputs": [
              {
                "name": "",
                "type": "bool"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": false,
            "inputs": [],
            "name": "deposit",
            "outputs": [
              {
                "name": "ok",
                "type": "bool"
              }
            ],
            "payable": true,
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [
              {
                "name": "src",
                "type": "address"
              },
              {
                "name": "guy",
                "type": "address"
              }
            ],
            "name": "allowance",
            "outputs": [
              {
                "name": "",
                "type": "uint256"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": false,
            "inputs": [
              {
                "name": "amount",
                "type": "uint256"
              }
            ],
            "name": "tryWithdraw",
            "outputs": [
              {
                "name": "ok",
                "type": "bool"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "payable": true,
            "type": "fallback"
          },
          {
            "anonymous": false,
            "inputs": [
              {
                "indexed": true,
                "name": "who",
                "type": "address"
              },
              {
                "indexed": false,
                "name": "amount",
                "type": "uint256"
              }
            ],
            "name": "Deposit",
            "type": "event"
          },
          {
            "anonymous": false,
            "inputs": [
              {
                "indexed": true,
                "name": "who",
                "type": "address"
              },
              {
                "indexed": false,
                "name": "amount",
                "type": "uint256"
              }
            ],
            "name": "Withdrawal",
            "type": "event"
          },
          {
            "anonymous": false,
            "inputs": [
              {
                "indexed": true,
                "name": "from",
                "type": "address"
              },
              {
                "indexed": true,
                "name": "to",
                "type": "address"
              },
              {
                "indexed": false,
                "name": "value",
                "type": "uint256"
              }
            ],
            "name": "Transfer",
            "type": "event"
          },
          {
            "anonymous": false,
            "inputs": [
              {
                "indexed": true,
                "name": "owner",
                "type": "address"
              },
              {
                "indexed": true,
                "name": "spender",
                "type": "address"
              },
              {
                "indexed": false,
                "name": "value",
                "type": "uint256"
              }
            ],
            "name": "Approval",
            "type": "event"
          }
        ],
        "bytecode": "606060405260005b600160a060020a03331660009081526001602052604081208290558190555b505b610922806100376000396000f3006060604052361561009e5763ffffffff60e060020a60003504166306fdde0381146100b0578063095ea7b31461014057806318160ddd1461017357806323b872dd146101955780632e1a7d4d146101ce578063313ce567146101e357806370a082311461020557806395d89b4114610233578063a9059cbb146102c3578063d0e30db0146102f6578063dd62ed3e14610312578063e3fa588214610346575b6100ae5b6100aa61036d565b505b565b005b34156100b857fe5b6100c06103cd565b604080516020808252835181830152835191928392908301918501908083838215610106575b80518252602083111561010657601f1990920191602091820191016100e6565b505050905090810190601f1680156101325780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561014857fe5b61015f600160a060020a0360043516602435610404565b604080519115158252519081900360200190f35b341561017b57fe5b61018361046f565b60408051918252519081900360200190f35b341561019d57fe5b61015f600160a060020a036004358116906024351660443561047e565b604080519115158252519081900360200190f35b34156101d657fe5b6100ae600435610591565b005b34156101eb57fe5b6101836105aa565b60408051918252519081900360200190f35b341561020d57fe5b610183600160a060020a03600435166105af565b60408051918252519081900360200190f35b341561023b57fe5b6100c06105ce565b604080516020808252835181830152835191928392908301918501908083838215610106575b80518252602083111561010657601f1990920191602091820191016100e6565b505050905090810190601f1680156101325780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34156102cb57fe5b61015f600160a060020a0360043516602435610605565b604080519115158252519081900360200190f35b61015f61036d565b604080519115158252519081900360200190f35b341561031a57fe5b610183600160a060020a03600435811690602435166106c8565b60408051918252519081900360200190f35b341561034e57fe5b61015f6004356106f5565b604080519115158252519081900360200190f35b600160a060020a0333166000818152600160209081526040808320805434908101909155815190815290519293927fe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c929181900390910190a25060015b90565b60408051808201909152600b81527f5772617070657220455448000000000000000000000000000000000000000000602082015281565b600160a060020a03338116600081815260026020908152604080832094871680845294825280832086905580518681529051929493927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925929181900390910190a35060015b92915050565b600160a060020a033016315b90565b600160a060020a0383166000908152600160205260408120546104a490839010156107e0565b600160a060020a03808516600090815260026020908152604080832033909416835292905220546104d890839010156107e0565b600160a060020a038316600090815260016020526040902054610504906104ff90846107f1565b6107e0565b600160a060020a03808516600081815260026020908152604080832033861684528252808320805488900390558383526001825280832080548890039055938716808352918490208054870190558351868152935191937fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929081900390910190a35060015b9392505050565b61059a816106f5565b15156100aa5760006000fd5b5b50565b601281565b600160a060020a0381166000908152600160205260409020545b919050565b60408051808201909152600581527f572d455448000000000000000000000000000000000000000000000000000000602082015281565b600160a060020a03331660009081526001602052604081205461062b90839010156107e0565b600160a060020a038316600090815260016020526040902054610657906104ff90846107f1565b6107e0565b600160a060020a03338116600081815260016020908152604080832080548890039055938716808352918490208054870190558351868152935191937fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929081900390910190a35060015b92915050565b600160a060020a038083166000908152600260209081526040808320938516835292905220545b92915050565b60006106ff6108e4565b600160a060020a03331660009081526001602052604090205461072290846107ff565b33600160a060020a03811660009081526001602052604090209190915561074a908285610822565b1561079757604080518481529051600160a060020a033316917f7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65919081900360200190a2600191506107d9565b600160a060020a0333166000908152600160205260409020546107ba90846108b6565b600160a060020a03331660009081526001602052604081209190915591505b5b50919050565b8015156100aa5760006000fd5b5b50565b808201829010155b92915050565b600061080b83836108d9565b15156108175760006000fd5b508082035b92915050565b600083600160a060020a0316828460405180828051906020019080838360008314610868575b80518252602083111561086857601f199092019160209182019101610848565b505050905090810190601f1680156108945780820380516001836020036101000a031916815260200191505b5091505060006040518083038185876185025a03f193505050505b9392505050565b60006108c283836107f1565b15156108ce5760006000fd5b508181015b92915050565b818111155b92915050565b604080516020810190915260008152905600a165627a7a72305820a28a849337643999a68d2ac22a1417f83794fda4e2ecdd428d495dd88cb435220029"
      },
      "DSEthTokenEvents": {
        "interface": [
          {
            "anonymous": false,
            "inputs": [
              {
                "indexed": true,
                "name": "who",
                "type": "address"
              },
              {
                "indexed": false,
                "name": "amount",
                "type": "uint256"
              }
            ],
            "name": "Deposit",
            "type": "event"
          },
          {
            "anonymous": false,
            "inputs": [
              {
                "indexed": true,
                "name": "who",
                "type": "address"
              },
              {
                "indexed": false,
                "name": "amount",
                "type": "uint256"
              }
            ],
            "name": "Withdrawal",
            "type": "event"
          }
        ],
        "bytecode": "60606040523415600b57fe5b5b60338060196000396000f30060606040525bfe00a165627a7a723058209a5817f18e242944db4f7d7461039d7f83bab90e405c7baf429fd32feda358de0029"
      },
      "DSTokenBase": {
        "interface": [
          {
            "constant": false,
            "inputs": [
              {
                "name": "guy",
                "type": "address"
              },
              {
                "name": "wad",
                "type": "uint256"
              }
            ],
            "name": "approve",
            "outputs": [
              {
                "name": "",
                "type": "bool"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "totalSupply",
            "outputs": [
              {
                "name": "",
                "type": "uint256"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": false,
            "inputs": [
              {
                "name": "src",
                "type": "address"
              },
              {
                "name": "dst",
                "type": "address"
              },
              {
                "name": "wad",
                "type": "uint256"
              }
            ],
            "name": "transferFrom",
            "outputs": [
              {
                "name": "",
                "type": "bool"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [
              {
                "name": "src",
                "type": "address"
              }
            ],
            "name": "balanceOf",
            "outputs": [
              {
                "name": "",
                "type": "uint256"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": false,
            "inputs": [
              {
                "name": "dst",
                "type": "address"
              },
              {
                "name": "wad",
                "type": "uint256"
              }
            ],
            "name": "transfer",
            "outputs": [
              {
                "name": "",
                "type": "bool"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [
              {
                "name": "src",
                "type": "address"
              },
              {
                "name": "guy",
                "type": "address"
              }
            ],
            "name": "allowance",
            "outputs": [
              {
                "name": "",
                "type": "uint256"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "inputs": [
              {
                "name": "supply",
                "type": "uint256"
              }
            ],
            "payable": false,
            "type": "constructor"
          },
          {
            "anonymous": false,
            "inputs": [
              {
                "indexed": true,
                "name": "from",
                "type": "address"
              },
              {
                "indexed": true,
                "name": "to",
                "type": "address"
              },
              {
                "indexed": false,
                "name": "value",
                "type": "uint256"
              }
            ],
            "name": "Transfer",
            "type": "event"
          },
          {
            "anonymous": false,
            "inputs": [
              {
                "indexed": true,
                "name": "owner",
                "type": "address"
              },
              {
                "indexed": true,
                "name": "spender",
                "type": "address"
              },
              {
                "indexed": false,
                "name": "value",
                "type": "uint256"
              }
            ],
            "name": "Approval",
            "type": "event"
          }
        ],
        "bytecode": "6060604052341561000c57fe5b6040516020806104ae83398101604052515b600160a060020a03331660009081526001602052604081208290558190555b505b6104608061004e6000396000f3006060604052361561005c5763ffffffff60e060020a600035041663095ea7b3811461005e57806318160ddd1461009157806323b872dd146100b357806370a08231146100ec578063a9059cbb1461011a578063dd62ed3e1461014d575bfe5b341561006657fe5b61007d600160a060020a0360043516602435610181565b604080519115158252519081900360200190f35b341561009957fe5b6100a16101ec565b60408051918252519081900360200190f35b34156100bb57fe5b61007d600160a060020a03600435811690602435166044356101f3565b604080519115158252519081900360200190f35b34156100f457fe5b6100a1600160a060020a0360043516610306565b60408051918252519081900360200190f35b341561012257fe5b61007d600160a060020a0360043516602435610325565b604080519115158252519081900360200190f35b341561015557fe5b6100a1600160a060020a03600435811690602435166103e8565b60408051918252519081900360200190f35b600160a060020a03338116600081815260026020908152604080832094871680845294825280832086905580518681529051929493927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925929181900390910190a35060015b92915050565b6000545b90565b600160a060020a0383166000908152600160205260408120546102199083901015610415565b600160a060020a038085166000908152600260209081526040808320339094168352929052205461024d9083901015610415565b600160a060020a038316600090815260016020526040902054610279906102749084610426565b610415565b600160a060020a03808516600081815260026020908152604080832033861684528252808320805488900390558383526001825280832080548890039055938716808352918490208054870190558351868152935191937fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929081900390910190a35060015b9392505050565b600160a060020a0381166000908152600160205260409020545b919050565b600160a060020a03331660009081526001602052604081205461034b9083901015610415565b600160a060020a038316600090815260016020526040902054610377906102749084610426565b610415565b600160a060020a03338116600081815260016020908152604080832080548890039055938716808352918490208054870190558351868152935191937fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929081900390910190a35060015b92915050565b600160a060020a038083166000908152600260209081526040808320938516835292905220545b92915050565b8015156104225760006000fd5b5b50565b808201829010155b929150505600a165627a7a72305820b95ed851ed0c134065772e5e7797e0f3fd3e613ca903cdc72a6cca161d1cfae30029"
      },
      "ERC20": {
        "interface": [
          {
            "constant": false,
            "inputs": [
              {
                "name": "spender",
                "type": "address"
              },
              {
                "name": "value",
                "type": "uint256"
              }
            ],
            "name": "approve",
            "outputs": [
              {
                "name": "ok",
                "type": "bool"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "totalSupply",
            "outputs": [
              {
                "name": "supply",
                "type": "uint256"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": false,
            "inputs": [
              {
                "name": "from",
                "type": "address"
              },
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "value",
                "type": "uint256"
              }
            ],
            "name": "transferFrom",
            "outputs": [
              {
                "name": "ok",
                "type": "bool"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [
              {
                "name": "who",
                "type": "address"
              }
            ],
            "name": "balanceOf",
            "outputs": [
              {
                "name": "value",
                "type": "uint256"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": false,
            "inputs": [
              {
                "name": "to",
                "type": "address"
              },
              {
                "name": "value",
                "type": "uint256"
              }
            ],
            "name": "transfer",
            "outputs": [
              {
                "name": "ok",
                "type": "bool"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [
              {
                "name": "owner",
                "type": "address"
              },
              {
                "name": "spender",
                "type": "address"
              }
            ],
            "name": "allowance",
            "outputs": [
              {
                "name": "_allowance",
                "type": "uint256"
              }
            ],
            "payable": false,
            "type": "function"
          },
          {
            "anonymous": false,
            "inputs": [
              {
                "indexed": true,
                "name": "from",
                "type": "address"
              },
              {
                "indexed": true,
                "name": "to",
                "type": "address"
              },
              {
                "indexed": false,
                "name": "value",
                "type": "uint256"
              }
            ],
            "name": "Transfer",
            "type": "event"
          },
          {
            "anonymous": false,
            "inputs": [
              {
                "indexed": true,
                "name": "owner",
                "type": "address"
              },
              {
                "indexed": true,
                "name": "spender",
                "type": "address"
              },
              {
                "indexed": false,
                "name": "value",
                "type": "uint256"
              }
            ],
            "name": "Approval",
            "type": "event"
          }
        ],
        "bytecode": ""
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
  module.exports = Dapple['ds-eth-token'];
}

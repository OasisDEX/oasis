// console.log('package-post-init start')
Dapple.init = function init(env) {
  if (env === 'test' || env === 'ropsten') {
    Dapple.env = 'ropsten';
    Dapple['maker-otc'].class(web3, Dapple['maker-otc'].environments.ropsten);
    Dapple['token-wrapper'].class(web3, Dapple['token-wrapper'].environments.ropsten);
    Dapple.makerjs = new Dapple.Maker(web3, 'ropsten');
  } else if (env === 'live' || env === 'main') {
    Dapple.env = 'live';
    Dapple['maker-otc'].class(web3, Dapple['maker-otc'].environments.live);
    Dapple['token-wrapper'].class(web3, Dapple['token-wrapper'].environments.live);
    Dapple.makerjs = new Dapple.Maker(web3, 'live');
  } else if (env === 'private' || env === 'default') {
    Dapple['maker-otc'].class(web3, Dapple['maker-otc'].environments.default);
    Dapple['token-wrapper'].class(web3, Dapple['token-wrapper'].environments.default);
  } else if (env === 'morden') {
    Dapple.env = 'morden';
    Dapple['maker-otc'].class(web3, Dapple['maker-otc'].environments.morden);
    Dapple['token-wrapper'].class(web3, Dapple['token-wrapper'].environments.morden);
    Dapple.makerjs = new Dapple.Maker(web3, 'morden');
  }

  if (env !== false) {
    // Check if contract exists on new environment
    const contractAddress = Dapple['maker-otc'].environments[Dapple.env].otc.value;
    web3.eth.getCode(contractAddress, (error, code) => {
      Session.set('contractExists', !error && typeof code === 'string' && code !== '' && code !== '0x');
    });
  }
};

// XXX generated blocknumbers, should use incremental lookback instead
Dapple.getFirstContractBlock = () => {
  let blockNumber = 0;
  if (Dapple.env === 'live') {
    blockNumber = 2100636;
  } else if (Dapple.env === 'ropsten') {
    blockNumber = 23612;
  } else if (Dapple.env === 'morden') {
    blockNumber = 1524881;
  }
  return blockNumber;
};

const tokens = {
  ropsten: {
    'W-ETH': '0xece9fa304cc965b00afc186f5d0281a00d3dbbfd',
    DAI: '0x0000000000000000000000000000000000000000',
    MKR: '0xa7f6c9a5052a08a14ff0e3349094b6efbc591ea4',
    DGD: '0x1ab3bd2e2670d6e00ca406217e4d327f7f946d7e',
    GNT: '0x7fb3c4ff78bd0305a6ec436eda79303f981c5938',
    'W-GNT': '0xa5d92f318247c3b43241436dbb55ec4be600dc42',
  },
  morden: {
    'W-ETH': '0x52fe88b987c7829e5d5a61c98f67c9c14e6a7a90',
    DAI: '0xa6581e37bb19afddd5c11f1d4e5fb16b359eb9fc',
    MKR: '0xffb1c99b389ba527a9194b1606b3565a07da3eef',
    DGD: '0x3c6f5633b30aa3817fa50b17e5bd30fb49bddd95',
    GNT: '0x0000000000000000000000000000000000000000',
    'W-GNT': '0x0000000000000000000000000000000000000000',
  },
  live: {
    'W-ETH': '0xecf8f87f810ecf450940c9f60066b4a7a501d6a7',
    DAI: '0x0000000000000000000000000000000000000000',
    MKR: '0xc66ea802717bfb9833400264dd12c2bceaa34a6d',
    DGD: '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a',
    GNT: '0xa74476443119a942de498590fe1f2454d7d4ac0d',
    'W-GNT': '0x01afc37f4f85babc47c0e2d0eababc7fb49793c8',
  },
};

// http://numeraljs.com/ for formats
const tokenSpecs = {
  'W-ETH': { precision: 18, format: '0,0.00[0000000000000000]' },
  DAI: { precision: 18, format: '0,0.00[0000000000000000]' },
  MKR: { precision: 18, format: '0,0.00[0000000000000000]' },
  DGD: { precision: 9, format: '0,0.00[0000000]' },
  GNT: { precision: 18, format: '0,0.00[0000000000000000]' },
  'W-GNT': { precision: 18, format: '0,0.00[0000000000000000]' },
};

Dapple.getQuoteTokens = () => ['W-ETH'];

Dapple.getBaseTokens = () => ['MKR', 'DAI', 'DGD', 'W-GNT'];

Dapple.getTokens = () => ['W-ETH', 'MKR', 'DAI', 'DGD', 'W-GNT'];

Dapple.getTokenSpecs = (symbol) => {
  if (typeof (tokenSpecs[symbol]) !== 'undefined') {
    return tokenSpecs[symbol];
  }
  return tokenSpecs['W-ETH'];
};

Dapple.getTokenAddress = (symbol) => tokens[Dapple.env][symbol];

Dapple.getTokenByAddress = (address) => _.invert(tokens[Dapple.env])[address];

Dapple.getToken = (symbol, callback) => {
  if (!(Dapple.env in tokens)) {
    callback('Unknown environment', null);
    return;
  }
  if (!(symbol in tokens[Dapple.env])) {
    callback(`Unknown token "${symbol}"`, null);
    return;
  }

  let tokenClass = 'DSTokenFrontend';
  const address = Dapple.getTokenAddress(symbol);
  let that = Dapple.makerjs.dappsys;

  if (symbol === 'W-ETH') {
    tokenClass = 'DSEthToken';
  } else if (symbol === 'W-GNT') {
    tokenClass = 'TokenWrapper';
    that = Dapple['token-wrapper'];
  }

  try {
    that.classes[tokenClass].at(address, (error, token) => {
      if (!error) {
        token.abi = that.classes[tokenClass].abi;
        callback(false, token);
      } else {
        callback(error, token);
      }
    });
  } catch (e) {
    callback(e, null);
  }
};

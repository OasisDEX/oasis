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
  } else if (env === 'private') {
    Dapple.env = 'develop';
    Dapple['maker-otc'].class(web3, Dapple['maker-otc'].environments.develop);
    Dapple['token-wrapper'].class(web3, Dapple['token-wrapper'].environments.develop);
    Dapple.makerjs = new Dapple.Maker(web3, 'develop');
  } else if (env === 'default') {
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
    REP: '0xf75caa57375a75dfc1a7ea917d6abb2c95511053',
    ICN: '0x5b73d26807ea72287bafa1a27fccf8ece5deabc4',
    '1ST': '0xa8c784efdfe7d48bc5df28f770b6454a037e2abe',
    SNGLS: '0xf48cf5ad04afa369fe1ae599a8f3699c712b0352',
    VSL: '0x5017f42cf680fcbcab1093263468745c9af63e35',
    PLU: '0xcfe185ce294b443c16dd89f00527d8b25c45bf9d',
    MLN: '0xd4a8f8293d639752e263be3869057eaf7536e005',
  },
  morden: {
    'W-ETH': '0x52fe88b987c7829e5d5a61c98f67c9c14e6a7a90',
    DAI: '0xa6581e37bb19afddd5c11f1d4e5fb16b359eb9fc',
    MKR: '0xffb1c99b389ba527a9194b1606b3565a07da3eef',
    DGD: '0x3c6f5633b30aa3817fa50b17e5bd30fb49bddd95',
    GNT: '0x0000000000000000000000000000000000000000',
    'W-GNT': '0x0000000000000000000000000000000000000000',
    REP: '0x0000000000000000000000000000000000000000',
    ICN: '0x0000000000000000000000000000000000000000',
    '1ST': '0x0000000000000000000000000000000000000000',
    SNGLS: '0x0000000000000000000000000000000000000000',
    VSL: '0x0000000000000000000000000000000000000000',
    PLU: '0x0000000000000000000000000000000000000000',
    MLN: '0x0000000000000000000000000000000000000000',
  },
  live: {
    'W-ETH': '0xecf8f87f810ecf450940c9f60066b4a7a501d6a7',
    DAI: '0x0000000000000000000000000000000000000000',
    MKR: '0xc66ea802717bfb9833400264dd12c2bceaa34a6d',
    DGD: '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a',
    GNT: '0xa74476443119a942de498590fe1f2454d7d4ac0d',
    'W-GNT': '0x01afc37f4f85babc47c0e2d0eababc7fb49793c8',
    REP: '0x48c80f1f4d53d5951e5d5438b54cba84f29f32a5',
    ICN: '0x888666ca69e0f178ded6d75b5726cee99a87d698',
    '1ST': '0xaf30d2a7e90d7dc361c8c4585e9bb7d2f6f15bc7',
    SNGLS: '0xaec2e87e0a235266d9c5adc9deb4b2e29b54d009',
    VSL: '0x5c543e7ae0a1104f78406c340e9c64fd9fce5170',
    PLU: '0xd8912c10681d8b21fd3742244f44658dba12264e',
    MLN: '0xbeb9ef514a379b997e0798fdcc901ee474b6d9a1',
  },
  develop: {
    'W-ETH': '0x0000000000000000000000000000000000000000',
    DAI: '0x0000000000000000000000000000000000000000',
    MKR: '0x0000000000000000000000000000000000000000',
    DGD: '0x0000000000000000000000000000000000000000',
    GNT: '0x0000000000000000000000000000000000000000',
    'W-GNT': '0x0000000000000000000000000000000000000000',
    REP: '0x0000000000000000000000000000000000000000',
    ICN: '0x0000000000000000000000000000000000000000',
    '1ST': '0x0000000000000000000000000000000000000000',
    SNGLS: '0x0000000000000000000000000000000000000000',
    VSL: '0x0000000000000000000000000000000000000000',
    PLU: '0x0000000000000000000000000000000000000000',
    MLN: '0x0000000000000000000000000000000000000000',
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
  REP: { precision: 18, format: '0,0.00[0000000000000000]' },
  ICN: { precision: 18, format: '0,0.00[0000000000000000]' },
  '1ST': { precision: 18, format: '0,0.00[0000000000000000]' },
  SNGLS: { precision: 0, format: '0,0' },
  VSL: { precision: 18, format: '0,0.00[0000000000000000]' },
  PLU: { precision: 18, format: '0,0.00[0000000000000000]' },
  MLN: { precision: 18, format: '0,0.00[0000000000000000]' },
};

Dapple.getQuoteTokens = () => ['W-ETH'];

Dapple.getBaseTokens = () => ['MKR', 'DGD', 'W-GNT', 'REP', 'ICN', '1ST', 'SNGLS', 'VSL', 'PLU', 'MLN'];

Dapple.getTokens = () => ['W-ETH', 'MKR', 'DGD', 'GNT', 'W-GNT', 'REP', 'ICN', '1ST', 'SNGLS', 'VSL', 'PLU', 'MLN'];

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

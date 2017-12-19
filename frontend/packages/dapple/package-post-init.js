const config = require('./config.json');
const ENVs = {
  'test': 'kovan',
  'main': 'live',
  'private': 'default',
};

Dapple.init = function init(env) {
  var predefinedEnv = ENVs[env];

  if (!predefinedEnv) {
    predefinedEnv = env;
  }

  Dapple.env = predefinedEnv;
  Dapple['maker-otc']['environments'][Dapple.env].otc.value = config.market[Dapple.env].address;
  Dapple['maker-otc']['environments'][Dapple.env].otc.blockNumber = config.market[Dapple.env].blockNumber;
  Dapple['maker-otc'].class(web3Obj, Dapple['maker-otc'].environments[Dapple.env]);
  Dapple['ds-eth-token'].class(web3Obj, Dapple['ds-eth-token'].environments[Dapple.env]);
  Dapple['token-wrapper'].class(web3Obj, Dapple['token-wrapper'].environments[Dapple.env]);

  if (env) {
    // Check if contract exists on new environment
    const contractAddress = Dapple['maker-otc'].environments[Dapple.env].otc.value;
    web3Obj.eth.getCode(contractAddress, (error, code) => {
      Session.set('contractExists', !error && typeof code === 'string' && code !== '' && code !== '0x');
    });
  }
};

const tokens = config.tokens;

// http://numeraljs.com/ for formats
const tokenSpecs = {
  'OW-ETH': { precision: 18, format: '0,0.00[0000000000000000]' },
  'W-ETH': { precision: 18, format: '0,0.00[0000000000000000]' },
  DAI: { precision: 18, format: '0,0.00[0000000000000000]' },
  SAI: { precision: 18, format: '0,0.00[0000000000000000]' },
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
  RHOC: { precision: 8, format: '0,0.00[000000]' },
  TIME: { precision: 8, format: '0,0.00[000000]' },
  GUP: { precision: 3, format: '0,0.00[0]' },
  BAT: { precision: 18, format: '0,0.00[0000000000000000]' },
  NMR: { precision: 18, format: '0,0.00[0000000000000000]' },
};

Dapple.getQuoteTokens = () => ['W-ETH'];

Dapple.getBaseTokens = () => ['W-GNT', 'DGD', 'REP', 'ICN', '1ST', 'SNGLS', 'VSL', 'PLU', 'MLN', 'RHOC', 'TIME', 'GUP', 'BAT', 'NMR'];

Dapple.getTokens = () => ['W-ETH', 'MKR', 'DGD', 'GNT', 'W-GNT', 'REP', 'ICN', '1ST', 'SNGLS', 'VSL', 'PLU', 'MLN', 'RHOC', 'TIME', 'GUP', 'BAT', 'NMR', 'SAI', 'DAI'];

Dapple.generatePairs = () => {
  const TradingPairs = [
    {
      base: 'SAI',
      quote: 'W-ETH',
      priority: 10,
    },
  ];

  return TradingPairs;
};

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

  const address = Dapple.getTokenAddress(symbol);
  let tokenClass = 'DSTokenBase';
  let that = Dapple['ds-eth-token'];

  if (symbol === 'W-ETH' || symbol === 'OW-ETH') {
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

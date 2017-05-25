Package.describe({
  name: 'makerotc:dapple',
  version: '0.0.1',
  summary: 'Dapple related code for MakerOTC',
  git: '',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.4.0.1');

  api.use('ecmascript', 'client');
  api.use('ethereum:web3', 'client');

  api.addFiles(['package-pre-init.js'], 'client');
  api.addFiles(['contracts-abi/maker-otc.js'], 'client');
  api.addFiles(['contracts-abi/ds-eth-token.js'], 'client');
  api.addFiles(['contracts-abi/token-wrapper.js'], 'client');
  api.addFiles(['contracts-abi/simple-market.js'], 'client');
  api.addFiles(['contracts-abi/expiring-market.js'], 'client');
  api.addFiles(['contracts-abi/matching-market.js'], 'client');
  api.addFiles(['package-post-init.js'], 'client');

  api.export('web3Obj', 'client');
  api.export('Dapple', 'client');
});

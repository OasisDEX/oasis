Package.describe({
  name: 'makerotc:dapple',
  version: '0.0.1',
  summary: 'Dapple related code for MakerOTC',
  git: '',
  documentation: 'README.md'
})

Package.onUse(function (api) {
  api.versionsFrom('1.2.1')

  api.use('ethereum:web3', 'client')

  api.addFiles(['package-pre-init.js'], 'client')
  api.addFiles(['build/meteor.js'], 'client')
  api.addFiles(['maker.js'], 'client')
  api.addFiles(['package-post-init.js'], 'client')

  api.export('web3', 'client')
  api.export('Dapple', 'client')
})

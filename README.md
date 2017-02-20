[![Oasis Header](https://cloud.githubusercontent.com/assets/5337809/23130981/a3ef51b2-f788-11e6-9c8a-326368c3cf2e.png)]()
---
[![Stories in Ready](https://badge.waffle.io/MakerDAO/maker-market.png?label=ready&title=Ready)](https://waffle.io/MakerDAO/maker-market)
[![Build Status](https://api.travis-ci.org/makerdao/maker-market.svg?branch=master)](https://travis-ci.org/makerdao/maker-market)


This is a simple on-chain OTC market for ERC20 Standard Tokens on the Ethereum Blockchain. You can either pick an order from the order book (in which case delivery will happen instantly), or submit a new order yourself.

**Oasis PRO is undergoing alpha testing: Proceed at your own risk, and use only small amounts of ETH and MKR.**

## Overview

This dapp uses Meteor as frontend; the contract side can be tested and deployed using dapple.

## Usage (for Users)

Ensure you have a locally running ethereum node.

## Installation (for Developers)

Requirements:

* geth `brew install ethereum` (or [`apt-get` for ubuntu](https://github.com/ethereum/go-ethereum/wiki/Installation-Instructions-for-Ubuntu))
* solidity https://solidity.readthedocs.org/en/latest/installing-solidity.html
* meteor `curl https://install.meteor.com/ | sh`
* Global dapple, `npm install -g dapple meteor-build-client`

Clone and install:

```bash
git clone https://github.com/OasisDEX/oasis-plus.git
cd oasis-plus
git submodule update --init --recursive
npm install
npm run build
```

## Usage (for Developers)

You need to build the JS wrappers for the Dapple contracts:

```bash
npm run build
```

To run the frontend, start meteor:

```bash
cd frontend 
npm install
meteor
```

If you got the error message `File not found: build/maker-otc.js` or `File not found: build/token-wrapper.js`, then you forgot to run the build step from above.

You can access the user interface on [http://localhost:3000/](http://localhost:3000/)

To deploy the frontend to Github Pages:

```bash
gulp deploy
```

## Development

This project uses the [AirBnB style guide](https://github.com/airbnb/javascript) for coding standard guidelines.
We use [ESLint](http://eslint.org/docs/user-guide/getting-started) to automatically check for common code problems or style errors.
There's an eslintConfig section in frontend/package.json for the configuration of ESLint.
You can run the linter with:

```bash
cd frontend
meteor npm run lint
```

## TODOs
See https://waffle.io/MakerDAO/maker-market

## Acknowledgements
* Simple Market contract by [Nikolai Mushegian](https://github.com/nmushegian)
* User interface design by [Daniel Brockman](https://github.com/dbrock)
* Blockchain Script by [Chris Hitchcott](https://github.com/hitchcott)

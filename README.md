[![MMRKT Header](https://ipfs.pics/ipfs/QmYzq3MwiiLZycJ6Fv7LU12HY6ssXRBA4ocHn5mMVU8TQz)]()
---
[![Stories in Ready](https://badge.waffle.io/MakerDAO/maker-market.png?label=ready&title=Ready)](https://waffle.io/MakerDAO/maker-market)
[![Build Status](https://api.travis-ci.org/makerdao/maker-market.svg?branch=master)](https://travis-ci.org/makerdao/maker-market)


This is a simple on-chain OTC market for MKR. You can either pick an order from the order book (in which case delivery will happen instantly), or submit a new order yourself.

**Maker Market is undergoing alpha testing: Proceed at your own risk, and use only small amounts of ETH and MKR.**

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
git clone https://github.com/MakerDAO/maker-market
cd maker-market
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
cd frontend && meteor
```

If you got the error message `File not found: build/meteor.js`, then you forgot to run the build step from above.

You can access the user interface on [http://localhost:3000/](http://localhost:3000/)

To deploy the frontend to Github Pages:

```bash
gulp deploy
```

## TODOs
See https://waffle.io/MakerDAO/maker-market

## Acknowledgements
* Simple Market contract by [Nikolai Mushegian](https://github.com/nmushegian)
* User interface design by [Daniel Brockman](https://github.com/dbrock)
* Blockchain Script by [Chris Hitchcott](https://github.com/hitchcott)

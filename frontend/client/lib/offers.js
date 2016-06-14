this.Offers = new Meteor.Collection(null)
this.Trades = new Meteor.Collection(null)

this.PRICE_CURRENCY = 'USD'
this.Status = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  BOUGHT: 'bought'
}

var OFFER_GAS = 300000
var BUY_PARTIAL_GAS = 300000
var CANCEL_GAS = 150000

function formattedString (str) {
  return web3.toAscii(str).replace(/\0[\s\S]*$/g, '').trim()
}

var helpers = {
  volume: function (currency) {
    if (this.buy_which_token === currency) {
      return this.buy_how_much
    } else if (this.sell_which_token === currency) {
      return this.sell_how_much
    } else {
      return '0'
    }
  },
  type: function () {
    var baseCurrency = Session.get('baseCurrency')
    if (this.buy_which_token === baseCurrency) {
      return 'bid'
    } else if (this.sell_which_token === baseCurrency) {
      return 'ask'
    } else {
      return ''
    }
  },
  price: function () {
    var quoteCurrency = Session.get('quoteCurrency')
    var baseCurrency = Session.get('baseCurrency')
    if (this.buy_which_token === quoteCurrency && this.sell_which_token === baseCurrency) {
      return new BigNumber(this.buy_how_much).div(new BigNumber(this.sell_how_much)).toString(10)
    } else if (this.buy_which_token === baseCurrency && this.sell_which_token === quoteCurrency) {
      return new BigNumber(this.sell_how_much).div(new BigNumber(this.buy_how_much)).toString(10)
    } else {
      return '0'
    }
  }
}

Offers.helpers(_.extend(helpers, {
  canCancel: function () {
    var address = Session.get('address')
    return this.status === Status.CONFIRMED && address === this.owner
  },
  isMine: function () {
    var address = Session.get('address')
    return address === this.owner
  }
}))

Trades.helpers(helpers)

/**
 * Syncs up all offers and trades
 */
Offers.sync = function () {
  Offers.remove({})

  // Watch ItemUpdate Event
  Dapple['maker-otc'].objects.otc.ItemUpdate(function (error, result) {
    if (!error) {
      var id = result.args.id.toNumber()
      Offers.syncOffer(id)
      Offers.remove(result.transactionHash)
      if (Session.equals('selectedOffer', result.transactionHash)) {
        Session.set('selectedOffer', id.toString())
      }
    }
  })

  // Sync all past offers
  Dapple['maker-otc'].objects.otc.last_offer_id(function (error, n) {
    if (!error) {
      var last_offer_id = n.toNumber()
      console.log('last_offer_id', last_offer_id)
      if (last_offer_id > 0) {
        Session.set('loading', true)
        Session.set('loadingProgress', 0)
        Offers.syncOffer(last_offer_id, last_offer_id)
      }
    }
  })

  // Watch Trade events
  Dapple['maker-otc'].objects.otc.Trade({}, { fromBlock: 0 }, function (error, trade) {
    if (!error) {
      // Transform arguments
      var args = {
        buy_which_token: formattedString(trade.args.buy_which_token),
        sell_which_token: formattedString(trade.args.sell_which_token),
        buy_how_much: trade.args.buy_how_much.toString(10),
        sell_how_much: trade.args.sell_how_much.toString(10)
      }
      // Get block for timestamp
      web3.eth.getBlock(trade.blockNumber, function (error, block) {
        if (!error) {
          Trades.upsert(trade.transactionHash, _.extend(block, trade, args))
        }
      })
    }
  })
}

/**
 * Syncs up a single offer
 */
Offers.syncOffer = function (id, max) {
  Dapple['maker-otc'].objects.otc.offers(id, function (error, data) {
    if (!error) {
      var idx = id.toString()
      var sell_how_much = data[0]
      var sell_which_token_address = data[1]
      var buy_how_much = data[2]
      var buy_which_token_address = data[3]
      var owner = data[4]
      var active = data[5]

      if (active) {
        Offers.updateOffer(idx, sell_how_much, sell_which_token_address, buy_how_much, buy_which_token_address, owner, Status.CONFIRMED)
      } else {
        Offers.remove(idx)
        if (Session.equals('selectedOffer', idx)) {
          $('#offerModal').modal('hide')
        }
      }
      if (max > 0 && id > 1) {
        Session.set('loadingProgress', Math.round(100 * (max - id) / max))
        Offers.syncOffer(id - 1, max)
      } else if (max > 0) {
        Session.set('loading', false)
      }
    }
  })
}

Offers.updateOffer = function (idx, sell_how_much, sell_which_token_address, buy_how_much, buy_which_token_address, owner, status) {
  if (!(sell_how_much instanceof BigNumber)) {
    sell_how_much = new BigNumber(sell_how_much)
  }
  if (!(buy_how_much instanceof BigNumber)) {
    buy_how_much = new BigNumber(buy_how_much)
  }

  var offer = {
    owner: owner,
    status: status,
    helper: status === Status.PENDING ? 'Your new order is being placed...' : '',
    buy_which_token_address: buy_which_token_address,
    buy_which_token: Dapple.getTokenByAddress(buy_which_token_address),
    sell_which_token_address: sell_which_token_address,
    sell_which_token: Dapple.getTokenByAddress(sell_which_token_address),
    buy_how_much: buy_how_much.toString(10),
    sell_how_much: sell_how_much.toString(10),
    ask_price: buy_how_much.div(sell_how_much).toNumber(),
    bid_price: sell_how_much.div(buy_how_much).toNumber()
  }

  Offers.upsert(idx, { $set: offer })
}

Offers.newOffer = function (sell_how_much, sell_which_token, buy_how_much, buy_which_token, callback) {
  var sell_which_token_address = Dapple.getTokenAddress(sell_which_token)
  var buy_which_token_address = Dapple.getTokenAddress(buy_which_token)

  Dapple['maker-otc'].objects.otc.offer(sell_how_much, sell_which_token_address, buy_how_much, buy_which_token_address, { gas: OFFER_GAS }, function (error, tx) {
    callback(error, tx)
    if (!error) {
      Offers.updateOffer(tx, sell_how_much, sell_which_token_address, buy_how_much, buy_which_token_address, web3.eth.defaultAccount, Status.PENDING)
      Transactions.add('offer', tx, { id: tx, status: Status.PENDING })
    }
  })
}

Offers.buyOffer = function (_id, _quantity) {
  var id = parseInt(_id, 10)
  var quantity = _quantity.toNumber()
  Offers.update(_id, { $unset: { helper: '' } })
  Dapple['maker-otc'].objects.otc.buyPartial(id.toString(10), quantity, { gas: BUY_PARTIAL_GAS }, function (error, tx) {
    if (!error) {
      Transactions.add('offer', tx, { id: _id, status: Status.BOUGHT })
      Offers.update(_id, { $set: { tx: tx, status: Status.BOUGHT, helper: 'Your buy / sell order is being processed...' } })
    } else {
      Offers.update(_id, { $set: { helper: error.toString() } })
    }
  })
}

Offers.cancelOffer = function (idx) {
  var id = parseInt(idx, 10)
  Offers.update(idx, { $unset: { helper: '' } })
  Dapple['maker-otc'].objects.otc.cancel(id, { gas: CANCEL_GAS }, function (error, tx) {
    if (!error) {
      Transactions.add('offer', tx, { id: idx, status: Status.CANCELLED })
      Offers.update(idx, { $set: { tx: tx, status: Status.CANCELLED, helper: 'Your order is being cancelled...' } })
    } else {
      Offers.update(idx, { $set: { helper: error.toString() } })
    }
  })
}

Transactions.observeRemoved('offer', function (document) {
  switch (document.object.status) {
    case Status.CANCELLED:
    case Status.BOUGHT:
      Offers.syncOffer(document.object.id)
      if (document.receipt.logs.length === 0) {
        Offers.update(document.object.id, { $set: { helper: document.object.status.toUpperCase() + ': Error during Contract Execution' } })
      } else {
        Offers.update(document.object.id, { $set: { helper: '' } })
      }
      break
    case Status.PENDING:
      // The ItemUpdate event will be triggered on successful generation, which will delete the object; otherwise set helper
      Offers.update(document.object.id, { $set: { helper: 'Error during Contract Execution' } })
      Meteor.setTimeout(function () {
        Offers.remove(document.object.id)
      }, 5000)
      break
  }
})

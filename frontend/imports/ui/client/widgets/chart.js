import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { moment } from 'meteor/momentjs:moment';
import { Session } from 'meteor/session';
import { BigNumber } from 'meteor/ethereum:web3';
import { EthTools } from 'meteor/ethereum:tools';
import { $ } from 'meteor/jquery';
import { Offers, Trades } from '/imports/api/offers';
import Chart from 'chart.js';
import './chart.html';

Template.chart.viewmodel({
  currentChart: 'DEPTH',
  showDepth() {
    return this.currentChart() === 'DEPTH' ? '' : 'hidden';
  },
  showVolume() {
    return this.currentChart() === 'VOLUME' ? '' : 'hidden';
  },
  chartChange() {
  },
});

Template.chart.helpers({
  createDepthChart() {
    const quoteCurrency = Session.get('quoteCurrency');
    const baseCurrency = Session.get('baseCurrency');
    const askPrices = []; // Array of ask prices
    const bidPrices = []; // Array of bid prices
    const askAmounts = []; // Array of ask amounts
    let bidAmounts = []; // Array of bid amounts

    const bids = Offers.find({ buyWhichToken: baseCurrency, sellWhichToken: quoteCurrency },
                              { sort: { bid_price: 1 } }).fetch();
    const asks = Offers.find({ buyWhichToken: quoteCurrency, sellWhichToken: baseCurrency },
                              { sort: { ask_price: 1 } }).fetch();

    asks.forEach(ask => {
      const index = askPrices.indexOf(ask.ask_price);
      if (index === -1) {
        // If it is the first order for this price

        // Keep track of new price index
        askPrices.push(ask.ask_price);

        if (askAmounts.length > 0) {
          // If there is a lower price we need to sum the amount of the previous price (to make a cumulative graph)
          askAmounts.push(askAmounts[askAmounts.length - 1].add(new BigNumber(ask.sellHowMuch)));
        } else {
          askAmounts.push(new BigNumber(ask.sellHowMuch));
        }
      } else {
        // If there was already another offer for the same price we add the new amount
        askAmounts[index] = askAmounts[index].add(new BigNumber(ask.sellHowMuch));
      }
    });

    bids.forEach(bid => {
      const index = bidPrices.indexOf(bid.bid_price);
      if (index === -1) {
        // If it is the first order for this price

        // Keep track of new price index and value
        bidPrices.push(bid.bid_price);
        bidAmounts.push(new BigNumber(bid.buyHowMuch));
      } else {
        bidAmounts[index] = bidAmounts[index].add(new BigNumber(bid.buyHowMuch));
      }

      // It is necessary to update all the previous prices adding the actual amount (to make a cumulative graph)
      bidAmounts = $.map(bidAmounts, (b, i) => ((i < bidAmounts.length - 1) ? b.add(bid.buyHowMuch) : b));
    });

    // All price values (bids & asks)
    const vals = bidPrices.concat(askPrices).sort((a, b) => (a < b ? -1 : 1));

    // Preparing arrays for graph
    const askAmountsGraph = [];
    const bidAmountsGraph = [];
    let index = null;
    let amount = null;

    for (let i = 0; i < vals.length; i++) {
      index = askPrices.indexOf(vals[i]);
      if (index !== -1) {
        // If there is a specific value for the price in asks, we add it
        amount = EthTools.formatBalance(askAmounts[index].toNumber()).replace(',', '');
      } else if (vals[i] < askPrices[0] || vals[i] > askPrices[askPrices.length - 1]) {
        // If the price is lower or higher than the asks range there is not value to print in the graph
        amount = {}; // Fake NULL as the library doesn't allow it
      } else {
        // If there is not an ask amount for this price, we need to add the previous amount
        amount = askAmountsGraph[askAmountsGraph.length - 1];
      }
      askAmountsGraph.push({ x: vals[i], y: amount });

      index = bidPrices.indexOf(vals[i]);
      if (index !== -1) {
        // If there is a specific value for the price in bids, we add it
        amount = EthTools.formatBalance(bidAmounts[index].toNumber()).replace(',', '');
      } else if (vals[i] < bidPrices[0] || vals[i] > bidPrices[bidPrices.length - 1]) {
         // If the price is lower or higher than the bids range there is not value to print in the graph
        amount = {}; // Fake NULL as the library doesn't allow it
      } else {
        // If there is not a bid amount for this price, we need to add the next available amount
        for (let j = 0; j < askPrices.length; j++) {
          if (bidPrices[j] >= vals[i]) {
            amount = EthTools.formatBalance(bidAmounts[j].toNumber()).replace(',', '');
            break;
          }
        }
      }
      bidAmountsGraph.push({ x: vals[i], y: amount });
    }

    // Use Meteor.defer() to craete chart after DOM is ready:
    Meteor.defer(() => {
      const ctx = document.getElementById('market-chart-depth');

      const myChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: $.map(vals, (v) => v.toFixed(5).replace(/0{0,3}$/, '')),
          datasets: [
            {
              label: 'Buy',
              data: bidAmountsGraph,
              backgroundColor: 'rgba(38, 166, 154, 0.2)',
              borderColor: 'rgba(38, 166, 154, 1)',
              borderWidth: 2,
              // fill: false,
              pointRadius: 0,
            },
            {
              label: 'Sell',
              data: askAmountsGraph,
              backgroundColor: 'rgba(239, 83, 80, 0.2)',
              borderColor: 'rgba(239, 83, 80, 1)',
              borderWidth: 2,
              // fill: false,
              pointRadius: 0,
            }],
        },
        options: {
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true,
              },
            }],
          },
        },
      });
    });
  },
  createVolumeChart() {
    if (!Session.get('loadingTradeHistory')) {
      const quoteCurrency = Session.get('quoteCurrency');
      const baseCurrency = Session.get('baseCurrency');
      const days = [];
      const vol = [];
      let day = null;

      for (let i = 6; i >= 0; i--) {
        days.push(moment(Date.now()).startOf('day').subtract(i, 'days'));
        vol.push(new BigNumber(0));
      }

      const trades = Trades.find({ $or: [
        { buyWhichToken: baseCurrency, sellWhichToken: quoteCurrency },
        { buyWhichToken: quoteCurrency, sellWhichToken: baseCurrency },
      ],
        timestamp: { $gte: days[0].unix() },
      });

      trades.forEach((trade) => {
        day = 0;

        for (let i = 1; i <= 7; i++) {
          if (i === 7) {
            day = 6;
            break;
          } else if (trade.timestamp < days[i].unix()) {
            day = i - 1;
            break;
          }
        }

        if (trade.buyWhichToken === quoteCurrency) {
          vol[day] = vol[day].add(new BigNumber(trade.sellHowMuch));
        } else {
          vol[day] = vol[day].add(new BigNumber(trade.buyHowMuch));
        }
      });

      // Use Meteor.defer() to craete chart after DOM is ready:
      Meteor.defer(() => {
        const ctx = document.getElementById('market-chart-volume');

        const myChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: $.map(days, (d) => d.format('ll')),
            datasets: [{
              label: 'Volume',
              data: $.map(vol, (v) => EthTools.formatBalance(v.toNumber()).replace(',', '')),
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 2,
              // fill: false,
              pointRadius: 0,
            }],
          },
          options: {
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true,
                },
              }],
            },
          },
        });
      });
    }
  },
});

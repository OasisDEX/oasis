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
    const askIndexes = []; // Array of ask prices
    const bidIndexes = []; // Array of bid prices
    const askValues = []; // Array of ask amounts
    let bidValues = []; // Array of bid amounts

    const bids = Offers.find({ buyWhichToken: baseCurrency, sellWhichToken: quoteCurrency },
                              { sort: { bid_price: 1 } }).fetch();
    const asks = Offers.find({ buyWhichToken: quoteCurrency, sellWhichToken: baseCurrency },
                              { sort: { ask_price: 1 } }).fetch();

    asks.forEach(ask => {
      const index = askIndexes.indexOf(ask.ask_price);
      if (index === -1) {
        // If it is the first order for this price

        // Keep track of new price index
        askIndexes.push(ask.ask_price);

        if (askValues.length > 0) {
          // If there is a lower price we need to sum the amount of the previous price (to make a cumulative graph)
          askValues.push(askValues[askValues.length - 1].add(new BigNumber(ask.sellHowMuch)));
        } else {
          askValues.push(new BigNumber(ask.sellHowMuch));
        }
      } else {
        // If there was already another offer for the same price we add the new amount
        askValues[index] = askValues[index].add(new BigNumber(ask.sellHowMuch));
      }
    });

    bids.forEach(bid => {
      const index = bidIndexes.indexOf(bid.bid_price);
      if (index === -1) {
        // If it is the first order for this price

        // Keep track of new price index and value
        bidIndexes.push(bid.bid_price);
        bidValues.push(new BigNumber(bid.buyHowMuch));
      } else {
        bidValues[index] = bidValues[index].add(new BigNumber(bid.buyHowMuch));
      }

      // It is necessary to update all the previous prices adding the actual amount (to make a cumulative graph)
      bidValues = $.map(bidValues, (b, i) => ((i < bidValues.length - 1) ? b.add(bid.buyHowMuch) : b));
    });

    // Use Meteor.defer() to craete chart after DOM is ready:
    Meteor.defer(() => {
      const ctx = document.getElementById('market-chart-depth');


      const bidValuesGraph = $.map(bidValues,
        (b, i) => ({ x: bidIndexes[i], y: EthTools.formatBalance(b.toNumber()).replace(',', '') }));

      // It is necessary to append the bid values to get the necessary offset for ask values
      const askValuesGraph = $.map(bidValues, () => askValues[askValues.length - 1]).concat(
        $.map(askValues,
        (a, i) => ({ x: askIndexes[i], y: EthTools.formatBalance(a.toNumber()).replace(',', '') })));


      const myChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: $.map(bidIndexes.concat(askIndexes), (val) => val.toFixed(5)),
          datasets: [
            {
              label: 'Buy',
              data: bidValuesGraph,
              backgroundColor: 'rgba(38, 166, 154, 0.2)',
              borderColor: 'rgba(38, 166, 154, 1)',
              borderWidth: 2,
              // fill: false,
              pointRadius: 0,
            },
            {
              label: 'Sell',
              data: askValuesGraph,
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

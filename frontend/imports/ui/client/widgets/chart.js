import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { moment } from 'meteor/momentjs:moment';
import { Session } from 'meteor/session';
import { BigNumber } from 'meteor/ethereum:web3';
import { EthTools } from 'meteor/ethereum:tools';
import { _ } from 'meteor/underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Offers, Trades } from '/imports/api/offers';
import Chart from '/imports/utils/Chart.min';
import './chart.html';

const charts = [];
const depthChart = new ReactiveVar(false, typeof charts.depth !== 'undefined');
const volumeChart = new ReactiveVar(false, typeof charts.volume !== 'undefined');

Template.chart.viewmodel({
  currentChart: 'DEPTH',
  showDepth() {
    return this.currentChart() === 'DEPTH' ? '' : 'hidden';
  },
  showVolume() {
    return this.currentChart() === 'VOLUME' ? '' : 'hidden';
  },
  getBodyTooltip(bodyItem) {
    return bodyItem.lines;
  },
  prepareTooltip(tooltip, canvasId) {
    let tooltipEl = document.getElementById('chartjs-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'chartjs-tooltip';
      document.body.appendChild(tooltipEl);
    }
    // Hide if no tooltip
    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return false;
    }
    // Set caret Position
    tooltipEl.classList.remove('above', 'below', 'no-transform');
    if (tooltip.yAlign) {
      tooltipEl.classList.add(tooltip.yAlign);
    } else {
      tooltipEl.classList.add('no-transform');
    }

    const position = document.getElementById(canvasId).getBoundingClientRect();
    tooltipEl.style.left = `${position.left + tooltip.caretX}px`;
    tooltipEl.style.top = `${position.top + tooltip.caretY}px`;
    tooltipEl.style.padding = `${tooltip.yPadding}px${tooltip.xPadding}px`;

    return tooltipEl;
  },
  fillDepthChart() {
    Meteor.defer(() => {
      if (typeof charts.depth === 'undefined') {
        const ctx = document.getElementById('market-chart-depth');
        charts.depth = new Chart(ctx, {
          type: 'line',
          data: {},
          options: {
            tooltips: {
              enabled: false,
              mode: 'index',
              position: 'nearest',
              custom: (tooltip) => {
                const tooltipEl = this.prepareTooltip(tooltip, 'market-chart-depth');
                if (tooltipEl && tooltip.body) {
                  tooltipEl.innerHTML = '';
                  tooltip.title.forEach((title) => {
                    tooltipEl.innerHTML += `<div class="row-custom-tooltip"><span class="left">Price: </span><span class="right">${title}</span></div>`;
                  });
                  tooltip.body.map(this.getBodyTooltip).forEach((body) => {
                    tooltipEl.innerHTML +=
                      `<div class="row-custom-tooltip middle"><span class="left">SUM(${Session.get('quoteCurrency')})</span><span class="right">${body}</span></div>`;
                    tooltipEl.innerHTML +=
                      `<div class="row-custom-tooltip"><span class="left">SUM(${Session.get('baseCurrency')})</span><span class="right">${body}</span></div>`;
                  });
                  tooltipEl.style.opacity = 1;
                }
              },
            },
            legend: {
              display: false,
            },
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true,
                },
              }],
            },
          },
        });
      }
    });

    if (depthChart
        && Session.get('isConnected') && !Session.get('outOfSync')
        && !Session.get('loading') && Session.get('loadingProgress') === 100) {
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
            askAmounts.push(askAmounts[askAmounts.length - 1].add(new BigNumber(ask.buyHowMuch)));
          } else {
            askAmounts.push(new BigNumber(ask.buyHowMuch));
          }
        } else {
          // If there was already another offer for the same price we add the new amount
          askAmounts[index] = askAmounts[index].add(new BigNumber(ask.buyHowMuch));
        }
      });

      bids.forEach(bid => {
        const index = bidPrices.indexOf(bid.bid_price);
        if (index === -1) {
          // If it is the first order for this price

          // Keep track of new price index and value
          bidPrices.push(bid.bid_price);
          bidAmounts.push(new BigNumber(bid.sellHowMuch));
        } else {
          bidAmounts[index] = bidAmounts[index].add(new BigNumber(bid.sellHowMuch));
        }

        // It is necessary to update all the previous prices adding the actual amount (to make a cumulative graph)
        bidAmounts = bidAmounts.map((b, i) => ((i < bidAmounts.length - 1) ? b.add(bid.sellHowMuch) : b));
      });

      // All price values (bids & asks)
      const vals = _.uniq(bidPrices.concat(askPrices).sort((a, b) => (a < b ? -1 : 1)));

      // Preparing arrays for graph
      const askAmountsGraph = [];
      const bidAmountsGraph = [];
      let index = null;
      let amount = null;

      for (let i = 0; i < vals.length; i++) {
        index = askPrices.indexOf(vals[i]);
        if (index !== -1) {
          // If there is a specific value for the price in asks, we add it
          amount = EthTools.formatBalance(askAmounts[index].toNumber()).replace(/,/g, '');
        } else if (vals[i] < askPrices[0] || vals[i] > askPrices[askPrices.length - 1]) {
          // If the price is lower or higher than the asks range there is not value to print in the graph
          amount = null;
        } else {
          // If there is not an ask amount for this price, we need to add the previous amount
          amount = askAmountsGraph[askAmountsGraph.length - 1];
        }
        askAmountsGraph.push({ x: vals[i], y: amount });

        index = bidPrices.indexOf(vals[i]);
        if (index !== -1) {
          // If there is a specific value for the price in bids, we add it
          amount = EthTools.formatBalance(bidAmounts[index].toNumber()).replace(/,/g, '');
        } else if (vals[i] < bidPrices[0] || vals[i] > bidPrices[bidPrices.length - 1]) {
          // If the price is lower or higher than the bids range there is not value to print in the graph
          amount = null;
        } else {
          // If there is not a bid amount for this price, we need to add the next available amount
          for (let j = 0; j < askPrices.length; j++) {
            if (bidPrices[j] >= vals[i]) {
              amount = EthTools.formatBalance(bidAmounts[j].toNumber()).replace(/,/g, '');
              break;
            }
          }
        }
        bidAmountsGraph.push({ x: vals[i], y: amount });
      }

      charts.depth.data.labels = vals.map((v) => v.toFixed(5).replace(/0{0,3}$/, ''));
      charts.depth.data.datasets = [
        {
          label: '',
          data: bidAmountsGraph,
          backgroundColor: 'rgba(38, 166, 154, 0.2)',
          borderColor: 'rgba(38, 166, 154, 1)',
          borderWidth: 3,
          // fill: false,
          pointStyle: 'circle',
          pointRadius: 3,
          pointBorderWidth: 1,
          pointBorderColor: '#1ABC9C',
          pointBackgroundColor: '#1ABC9C',
          hoverBackgroundColor: '#1ABC9C',
          hoverBorderColor: '#1ABC9C',
          hoverBorderWidth: 5,
          steppedLine: true,
          invertedStep: true,
        },
        {
          label: '',
          data: askAmountsGraph,
          backgroundColor: 'rgba(239, 83, 80, 0.2)',
          borderColor: '#EF5350',
          borderWidth: 3,
          // fill: false,
          pointStyle: 'circle',
          pointRadius: 3,
          pointBorderWidth: 1,
          pointBorderColor: '#EF5350',
          pointBackgroundColor: '#EF5350',
          hoverBackgroundColor: '#EF5350',
          hoverBorderColor: '#EF5350',
          hoverBorderWidth: 5,
          steppedLine: true,
        }];
      charts.depth.update();
    }
  },
  fillVolumeChart() {
    Meteor.defer(() => {
      if (typeof charts.volume === 'undefined') {
        const ctx = document.getElementById('market-chart-volume');
        charts.volume = new Chart(ctx, {
          type: 'line',
          data: {},
          options: {
            tooltips: {
              backgroundColor: '#ffffff',
              titleFontSize: 10,
              titleFontColor: '#4A4A4A',
              titleFontFamily: 'Arial, sans-serif',
              bodyFontColor: '#4A4A4A',
              cornerRadius: 4,
            },
            legend: {
              display: false,
            },
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true,
                },
              }],
            },
          },
        });
      }
    });

    if (volumeChart
        && !Session.get('loadingTradeHistory')) {
      const quoteCurrency = Session.get('quoteCurrency');
      const baseCurrency = Session.get('baseCurrency');
      const volumeCurrency = Session.get(`${Session.get('volumeSelector')}Currency`);
      const days = [];
      const vol = {};
      let day = null;

      for (let i = 6; i >= 0; i--) {
        day = moment(Date.now()).startOf('day').subtract(i, 'days');
        days.push(day);
        vol[day.unix() * 1000] = new BigNumber(0);
      }

      const trades = Trades.find({ $or: [
        { buyWhichToken: baseCurrency, sellWhichToken: quoteCurrency },
        { buyWhichToken: quoteCurrency, sellWhichToken: baseCurrency },
      ],
        timestamp: { $gte: days[0].unix() },
      });

      trades.forEach((trade) => {
        day = moment.unix(trade.timestamp).startOf('day').unix() * 1000;
        if (trade.buyWhichToken === volumeCurrency) {
          vol[day] = vol[day].add(new BigNumber(trade.buyHowMuch));
        } else {
          vol[day] = vol[day].add(new BigNumber(trade.sellHowMuch));
        }
      });

      charts.volume.data.labels = days.map((d) => d.format('ll'));

      charts.volume.data.datasets = [{
        label: 'Volume',
        data: Object.keys(vol).map((key) => EthTools.formatBalance(vol[key].toNumber()).replace(/,/g, '')),
        backgroundColor: 'rgba(140, 133, 200, 0.1)',
        borderColor: '#8D86C9',
        borderWidth: 3,
        // fill: false,
        pointBackgroundColor: '#8D86C9',
        pointRadius: 3,
      }];

      charts.volume.update();
    }
  },
});

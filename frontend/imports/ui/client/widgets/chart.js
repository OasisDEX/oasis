import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import './chart.html';

const Highcharts = require('highcharts/highstock');

window.Highcharts = Highcharts;
require('highcharts/modules/exporting')(Highcharts);

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
    // Use Meteor.defer() to craete chart after DOM is ready:
    Meteor.defer(() => {
      Highcharts.chart('market-chart-depth', {
        legend: {
          enabled: false,
        },
        chart: {
          type: 'area',
          height: 215,
          width: 380,
        },
        title: {
          text: '',
        },
        subtitle: {
          text: '',
        },
        xAxis: {
          type: 'datetime',
          labels: {
            overflow: '',
            enabled: false,
          },
        },
        tooltip: {
          valueDecimals: 2,
          valuePrefix: 'PRICE ',
          valueSuffix: '',
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: '#D8D8D8',
          shared: true,
          useHTML: true,
          headerFormat: '',
          pointFormat: '<div class="row row-tooltip"><div class="col-md-6 col-tooltip"><span class="tooltip-left">PRICE</span></div><div class="col-md-6 col-tooltip"><span class="tooltip-right">0,93001</span></div><div class="col-md-6 col-tooltip"><span class="tooltip-left">SUM(ETH)</span></div><div class="col-md-6 col-tooltip"><span class="tooltip-right">2357</span></div><div class="col-md-6 col-tooltip"><span class="tooltip-left">SUM(MKR)</span></div><div class="col-md-6 col-tooltip"><span class="tooltip-right">2675</span></div></div>',
          footerFormat: '',
        },
        yAxis: {
          title: {
            text: '',
          },
          minorGridLineWidth: 1,
          gridLineWidth: 1,
          alternateGridColor: null,
          plotBands: [{ // Light air
            from: 0,
            to: 7500,
            color: 'rgba(0, 0, 0, 0)',
            label: {
              text: '',
              enabled: false,
              style: {
                color: '#606060',
              },
            },
          }, { // Light breeze
            from: 1.5,
            to: 3.3,
            color: 'rgba(0, 0, 0, 0)',
            label: {
              text: '',
              style: {
                color: '#606060',
              },
            },
          }, { // Gentle breeze
            from: 3.3,
            to: 5.5,
            color: 'rgba(0, 0, 0, 0)',
            label: {
              text: '',
              style: {
                color: '#606060',
              },
            },
          }, { // Moderate breeze
            from: 5.5,
            to: 8,
            color: 'rgba(0, 0, 0, 0)',
            label: {
              text: '',
              style: {
                color: '#606060',
              },
            },
          }, { // Fresh breeze
            from: 8,
            to: 11,
            color: 'rgba(0, 0, 0, 0)',
            label: {
              text: '',
              style: {
                color: '#606060',
              },
            },
          }, { // Strong breeze
            from: 11,
            to: 14,
            color: 'rgba(0, 0, 0, 0)',
            label: {
              text: '',
              style: {
                color: '#606060',
              },
            },
          }, { // High wind
            from: 14,
            to: 15,
            color: 'rgba(0, 0, 0, 0)',
            label: {
              text: '',
              style: {
                color: '#606060',
              },
            },
          }],
        },
        plotOptions: {
          spline: {
            lineWidth: 4,
            states: {
              hover: {
                lineWidth: 5,
              },
            },
            marker: {
              enabled: false,
            },
            pointInterval: 3600000, // one hour
            pointStart: Date.UTC(2015, 4, 31, 0, 0, 0),
          },
        },
        series: [{
          lineColor: '#1ABC9C',
          lineWidth: 3,
          color: '#1ABC9C',
          fillOpacity: 0.1,
          name: 'SUM(ETH)',
          data: [15000, 14500, 13900, 14100, 12900, 11000, 9700, 8100, 7800, 6500, 7100, 5000, 3900, 2700, 1500, 0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],

        }, {
          lineColor: '#EF5350',
          lineWidth: 3,
          color: '#EF5350',
          fillOpacity: 0.1,
          name: 'SUM(MKR)',
          data: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 1200, 2100, 3600, 4700, 5900, 6100, 7500, 8900, 9300, 10900, 12100, 14000, 12600, 14500, 15000, 13456],
        }],
        navigation: {
          menuItemStyle: {
            fontSize: '10px',
          },
        },
      });
    });
  },
  createVolumeChart() {
    // Use Meteor.defer() to craete chart after DOM is ready:
    Meteor.defer(() => {
      Highcharts.chart('market-chart-volume', {
        legend: {
          enabled: false,
        },
        chart: {
          type: 'area',
          height: 215,
          width: 380,
        },
        title: {
          text: '',
        },
        subtitle: {
          text: '',
        },
        xAxis: {
          type: 'datetime',
          labels: {
            overflow: '',
            enabled: false,
          },
        },
        tooltip: {
          valueDecimals: 2,
          valuePrefix: 'PRICE ',
          valueSuffix: '',
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: '#D8D8D8',  
          shared: true,
          useHTML: true,
          headerFormat: '',
          pointFormat: '<div class="row row-tooltip"><div class="col-md-6 col-tooltip"><span class="tooltip-left">PRICE</span></div><div class="col-md-6 col-tooltip"><span class="tooltip-right">0,93001</span></div><div class="col-md-6 col-tooltip"><span class="tooltip-left">SUM(ETH)</span></div><div class="col-md-6 col-tooltip"><span class="tooltip-right">2357</span></div><div class="col-md-6 col-tooltip"><span class="tooltip-left">SUM(MKR)</span></div><div class="col-md-6 col-tooltip"><span class="tooltip-right">2675</span></div></div>',
          footerFormat: '',
        },
        yAxis: {
          title: {
            text: '',
          },
          minorGridLineWidth: 1,
          gridLineWidth: 1,
          alternateGridColor: null,
          plotBands: [{ // Light air
            from: 0,
            to: 7500,
            color: 'rgba(0, 0, 0, 0)',
            label: {
              text: '',
              enabled: false,
              style: {
                color: '#606060',
              },
            },
          }, { // Light breeze
            from: 1.5,
            to: 3.3,
            color: 'rgba(0, 0, 0, 0)',
            label: {
              text: '',
              style: {
                color: '#606060',
              },
            },
          }, { // Gentle breeze
            from: 3.3,
            to: 5.5,
            color: 'rgba(0, 0, 0, 0)',
            label: {
              text: '',
              style: {
                color: '#606060',
              },
            },
          }, { // Moderate breeze
            from: 5.5,
            to: 8,
            color: 'rgba(0, 0, 0, 0)',
            label: {
              text: '',
              style: {
                color: '#606060',
              },
            },
          }, { // Fresh breeze
            from: 8,
            to: 11,
            color: 'rgba(0, 0, 0, 0)',
            label: {
              text: '',
              style: {
                color: '#606060',
              },
            },
          }, { // Strong breeze
            from: 11,
            to: 14,
            color: 'rgba(0, 0, 0, 0)',
            label: {
              text: '',
              style: {
                color: '#606060',
              },
            },
          }, { // High wind
            from: 14,
            to: 15,
            color: 'rgba(0, 0, 0, 0)',
            label: {
              text: '',
              style: {
                color: '#606060',
              },
            },
          }],
        },
        plotOptions: {
          spline: {
            lineWidth: 4,
            states: {
              hover: {
                lineWidth: 5,
              },
            },
            marker: {
              enabled: false,
            },
            pointInterval: 3600000, // one hour
            pointStart: Date.UTC(2015, 4, 31, 0, 0, 0),
          },
        },
        series: [{
          lineColor: '#8D86C9',
          lineWidth: 3,
          color: '#8D86C9',
          fillOpacity: 0.1,
          name: 'SUM(ETH)',
          data: [0.6, 0.85, 0.89, 0.58, 0.6, 0.45, 0.7, 0.5, 0.46],

        }],
        navigation: {
          menuItemStyle: {
            fontSize: '10px',
          },
        },
      });
    });
  },
});

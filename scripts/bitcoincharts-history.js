/*
 * To run this script
 *
 * node btce/bitcoincharts-history.js
 *
 * This will begin to pull the bitcoin charts history data, process it, and populate the mongo store
 * bitcoin charts data is 15 mins behid
 *
 * http://bitcoincharts.com/about/markets-api/
 *
 * the output is CSV:
 * timestamp, price, amoutn
 *
 */

var https = require('https')
	, async = require('async')
	, mongoose = require('mongoose')
	, events = require('events')
  , config = require('../util').getConfig()
  , moment = require('moment')
	, uri ='https://api.bitcoincharts.com/v1/trades.csv'
  , poll = require('../lib/poll')
  , candleHarvester = require('../lib/candle-harvester')
	;

mongoose.connect(config.mongodb.bitcoincharts.uri);

var CandleModel = mongoose.model('Candle', require('../lib/schema/candle'));

CandleModel.find({}).sort({time:1}).limit(1).exec(function (err, docs) {

  if (err) return console.error(err);

  var since = docs[0] ? docs[0].time : moment().format('X')
    , duration = moment.duration(15,'minutes')
    ; 

  poll.make()
    .time(duration)
    .on('polling', function () {
      console.log('polling...');  
    })
    .on('still polling', function () {
      console.log('still polling...');  
    })
    .on('get data', function (cb) {

      var candles = [];

      //this harvests candles and pushes them onto a stack 
      var harvester = candleHarvester.make();

      // TODO need to add some builders to the harvester
      //

      harvester.on('harvest', function (candle) {
        candles.push(candle);
      });

      harvester.on('finish', function () {
        cb();
      });
     
      //make a request to grab the candles
      var req  = https.request(uri+'?symbol=btceUSD&since='+since, function (res) {
        res.setEncoding('utf-8');
        csv
          .from.stream(res)
          .on('record', function (row, index) {
            console.log('row ' + row.join(' ') + ' index ' + index);
            //time, price, amount
            harvester.harvest(moment.unix(Number(row[0])), Number(row[1]), Number(row[2]));
          });
          .on('end', function () {
            harvester.finish();
          });
      });
      req.on('error', function (err) {
        cb(err);
      });
      req.end();
      console.log('making request...');
    })
    .on('receive', function () {
      console.log('data received...');
    })
    .on('handle', function (candles) {
      if (!candles || !candles.length) return console.warn('No Data!');
      var dups = 0, failures = 0, imported = 0;
      var queue = async.queue(function (candle, cb) {
        new CandleModel(candle.toObject()).save(function (err) {
          if (err) {
            if (err.code === 11000) {
              dups++;
            }
            else {
              failures++;
              console.error(err);
            }
          }
          else {
            imported++;
          }
          cb();
        });
      },4);
      queue.drain = function () {
        console.log('Candles processed: '+['imported',imported,'duplicates',duplicates,'failures',failures].join(' '));
      };
      queue.push(candles);
    })
    .on('error', function (err) {
      console.error(err);
    })
    .start()
  ;
});

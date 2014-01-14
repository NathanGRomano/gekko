/*
 * To run this script
 *
 * node btce/history.js
 *
 * It will pull from btc-e.com api and populate the mongo store
 */

var https = require('https')
	, async = require('async')
	, mongoose = require('mongoose')
	, events = require('events')
  , config = require('../util').getConfig()
	, BTCE = require('btc-e')
	, key = config.normal.key
	, secret = config.normal.secret
	, uri ='https://btc-e.com/api/3/trades/btc_usd'
	, btce = new BTCE(key, secret)
  , Poll = require('./lib/poll');
	;

mongoose.connect(config.mongodb.btce.uri);

var Schema = new mongoose.Schema({
	t: String,
	p: Number,
	a: Number,
	ts: Number,
	tid: Number
});

Schema.path('tid').index({unique:true});

var Trade = mongoose.model('Trade', Schema);

Poll
  .make()
    .time((15)*1000)
    .on('polling', function () {
      console.log('polling...');  
    })
    .on('still polling', function () {
      console.log('still polling...');  
    })
    .on('get data', function (cb) {
      var req  = https.request(uri, function (res) {
        var data = '';
        res.setEncoding('utf-8');
        res.on('data', function (chunk) {
          console.log('receiving data...');
          data = data + chunk;
        });
        res.on('end', function () {
          console.log('parsing data...');
          try {
            cb(null, JSON.parse(data));
          }
          catch(e) {
            cb(e);
          }
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
    .on('handle', function (data) {
      if (!(data && data.btc_usd && data.btc_usd.length)) return console.warn('No Data!');
      console.log('handling data...');
      var run = [], errors = [], dups = 0;

      data.btc_usd.forEach(function (point) {
        run.push(function (cb) {
          new Trade({
            t: point.type.charAt(0),
            p: point.price,
            a: point.amount,
            tid: point.tid,
            ts: point.timestamp
          }).save(function (err) {
            if (err) {
              if (err.code === 11000) {
                dups++;
              }
              else {
                errors.push(err);
              }
              cb(null, 0);
            }
            else {
              cb(null, 1);
            }
          });
        });
      });

      async.series(run, function (err, results) {
        if (err) return console.error(err);
        if (errors.length) console.log(errors);

        var c = 0;
        results.forEach(function (r) {
          c+=r;
        });

        console.log('Recorded: ' + c + '/' + data.btc_usd.length + ' (' + c / data.btc_usd.length + ')% Duplicates: ' + dups);
      });

    })
    .on('error', function (err) {
      console.error(err);
    })
    .start()
  ;

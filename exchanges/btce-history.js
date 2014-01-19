var http = require('http');
var util = require('../util.js');
var moment = require('moment');
var _ = require('lodash');
var log = require('../log.js');

var Watcher = function(config) {
  if(_.isObject(config))
    this.symbol = config.market + config.currency;

  this.url = config.url;
  this.name = 'btce-history';

  _.bindAll(this);

}

Watcher.prototype.getTrades = function(since, callback, descending) {
  var params = { symbol: this.symbol };
  if(since)
    // we don't want to hammer bitcoincharts,
    // this will fetch trades between start and now
    params.start = since.format('X');
  // otherwise fetch trades within the last interval
  else 
    params.start = util.intervalsAgo(1).format('X');

  var args = _.toArray(arguments);
  var url = this.url + '?since='+params.start;
  console.log('fetching trades from ' + url + ' since '+new Date(params.start*1000));
  var req = http.request(url, _.bind(function (res) {
    var data = '';
    res.setEncoding('utf-8');
    res.on('data', function (chunk) {
      data = data + chunk;
    });
    res.on('end', function () {
      try {
        var obj = JSON.parse(data);
      }
      catch(e) {
        console.error(e);
        return this.retry(this.getTrades, args);
      }
      var trades = []
      _.each(obj, function(rec) {
        trades.push({
          date: rec.ts,
          price: rec.p,
          amount: rec.a
        });
      });
      if(descending)
        callback(trades.reverse());
      else
        callback(trades);
    });
    
  },this));

  req.on('error', _.bind(function (err) {
    console.error(err);
    this.retry(this.getTrades, args);
  },this));

  req.end();
}

// if the exchange errors we try the same call again after
// waiting 10 seconds
Watcher.prototype.retry = function(method, args) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..');

  var self = this;

  // make sure the callback (and any other fn)
  // is bound to Trader
  _.each(args, function(arg, i) {
    if(_.isFunction(arg))
      args[i] = _.bind(arg, self);
  });

  // run the failed method again with the same
  // arguments after wait
  setTimeout(
    function() { method.apply(self, args) },
    wait
  );
}

module.exports = Watcher;

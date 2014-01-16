var nearest = require('./nearest')
  , candle = require('./candle')
  ;

function Set (interval) {
  this.interval = interval;
  this.buckets = {};
}

Set.make = function (interval) {
  return new Set(interval);
};

Set.prototype.add = function (time, price, amount) {
  var bucket = this.getCandle(time);
  bucket.add(time, price, amount);
};

Set.prototype.getCandle = function (time) {
  var key = nearest(time).interval(this.interval);
  if (!this.buckets[key]) {
    this.buckets[key] = candle.make(key, this.interval);
  }
  return this.buckets[key];
};

Set.prototype.addCandle = function (candle) {
  if (!this.buckets[candle.time]) {
    this.buckets[candle.time] = candle;
  }
  else {
    this.buckets[candle.time].merge(candle);
  }
};

Set.prototype.compile = function () {
  var results = [];
  for (var k in this.buckets) {
    results.push(this.buckets[k].toObject());
  }
  return results;
};

Set.prototype.toCSV = function () {
  var lines = [];
  lines.push(['date', 'interval', 'open', 'high', 'low', 'close', 'volume'].join(','));
  for (var k in this.buckets) {
    lines.push(this.buckets[k].toCSV());
  }
  return lines.join("\n");
};

module.exports = Set;

var nearest = require('./nearest')
  , candle = require('./candle')
  ;

function Set (interval) {
  this.interval = interval;
  this.buckets = {};
}

/**
 * Makes a new Set
 *
 * @return Set
 */

Set.make = function (interval) {
  return new Set(interval);
};

/**
 * Adds the values into the set
 *
 * @param {Number} time
 * @param {Number} price
 * @param {Number} amount
 * @return Set
 */

Set.prototype.add = function (time, price, amount) {
  var bucket = this.getCandle(time);
  bucket.add(time, price, amount);
  return this;
};

/**
 * Gets a candle given the passed time
 *
 * @param {Number} time
 * @return
 */

Set.prototype.getCandle = function (time) {
  var key = nearest(time).interval(this.interval);
  if (!this.buckets[key]) {
    this.buckets[key] = candle.make(key, this.interval);
  }
  return this.buckets[key];
};

/**
 * Adds a candle
 *
 * @param {Candle} candle
 * @param {Boolean} merge *optional to merbe or replace
 * @return Harvester
 */

Set.prototype.addCandle = function (candle, merge) {
  if (!this.buckets[candle.time]) {
    this.buckets[candle.time] = candle;
  }
  else {
    // TODO not sure if we should merge or if we should add????
    if (merge) {
      this.buckets[candle.time].merge(candle);
    }
    else {
      this.buckets[candle.time] = candle;
    }
  }
  return this;
};

/**
 * compiles the results of our candles 
 *
 * @return Array
 */

Set.prototype.compile = function () {
  var results = [];
  for (var k in this.buckets) {
    results.push(this.buckets[k].toObject());
  }
  return results;
};

/**
 * Converts the candles to a CSV
 *
 * @return String
 */

Set.prototype.toCSV = function () {
  var lines = [];
  lines.push(['date', 'interval', 'open', 'high', 'low', 'close', 'volume'].join(','));
  for (var k in this.buckets) {
    lines.push(this.buckets[k].toCSV());
  }
  return lines.join("\n");
};

module.exports = Set;

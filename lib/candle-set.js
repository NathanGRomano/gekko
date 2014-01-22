var util = require('util')
  , events = require('events')
  , nearest = require('./nearest')
  , candle = require('./candle')
  ;

function Set (interval) {
  events.EventEmitter.call(this);
  this.interval = interval;
  this.buckets = {};
}

util.inherits(Set, events.EventEmitter);

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
  this.emit('populated', bucket, time, price, amount);
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
    this.emit('new', this.buckets[key]);
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
      this.emit('merge', this.buckets[candle.time], candle);
    }
    else {
      this.buckets[candle.time] = candle;
      this.emit('add', candle);
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
  lines.push(['time', 'interval', 'open', 'high', 'low', 'close', 'volume'].join(','));
  for (var k in this.buckets) {
    lines.push(this.buckets[k].toCSV());
  }
  return lines.join("\n");
};

/**
 * Converts the candles to an Array
 *
 * @return Array
 */

Set.prototype.toArray = function () {
  var results = [];
  for (var k in this.buckets) {
    results.push(this.buckets[k]);
  }
  return results;
};

/**
 * process each
 *
 * @param {function} fn
 */

Set.prototype.each = function (fn) {
  for (var k in this.buckets) {
    fn(this.buckets[k]);
  }
  return this;
};


module.exports = Set;

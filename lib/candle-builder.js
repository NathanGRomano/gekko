var util = require('util')
  , events = require('events')
  , nearest = require('../lib/nearest')
  , candle = require('./candle')
  ;

function Builder (interval) {
  events.EventEmitter.call(this);
  this.interval = interval;
  this.candle = null;
}

util.inherits(Builder, events.EventEmitter);

/**
 * Makes a Builder 
 *
 * @param {number} interval
 * @return Builder
 */

Builder.make = function (interval) {
  return new Builder(interval);
};

/**
 * This method will compare the passed values to see if it
 * fits into the current candle being built.  If it does the
 * values are added to the candle.  If not the candle is emited
 * with the "finish" event and a new candle is started.
 *
 * @param {number} time
 * @param {number} price
 * @param {number} amount
 *
 */

Builder.prototype.add = function (time, price, amount) {
  var key = nearest(time).interval(this.interval);
  if (!this.candle) {
    this.start(key);
  }
  else if (key > this.candle.time) {
    this.finish().start(key);
  }
  this.candle.add(time, price, amount);
};

/**
 * This method will emit a "finish" event with the
 * current candle if we have one
 *
 * @return Builder
 */

Builder.prototype.finish = function () {
  if (this.candle) {
    this.emit('finish', this.candle);
    this.candle = null;
  }
  return this;
};

/**
 * This method will emit a "start" event when it
 * starts a new candle or a "building" event when
 * the candle has not been finsihed.
 *
 * @param {number} time
 * @return Candle
 */

Builder.prototype.start = function (time) {
  if (this.candle) {
    this.emit('building', this.candle);
  }
  else {
    this.candle = candle.make(time, this.interval);
    this.emit('start', this.candle);
  }
  return this.candle;
};

/**
 * This method will determine if we are in progress of building
 * a candle
 *
 * @return boolean
 */

Builder.prototype.inProgress = function () {
  return this.candle ? true : false;
};



module.exports = Builder;

var util = require('util')
  , events = require('events')
  , candleBuilder = require('./candle-builder');

function Harvester () {
  events.EventEmitter.call(this);
  this.builders = {};
  this.builderCount = 0;
}

util.inherits(Harvester, events.EventEmitter);

/**
 * make a harvester
 *
 * @return Harvester
 */

Harvester.make = function () {
  return new Harvester();
};

/**
 * Harvest the data and passes it to the builders
 *
 * @param {Number} time * should be in milliseconds
 * @param {Number} price
 * @param {Number} amount
 * @return Harvester
 */

Harvester.prototype.harvest = function (time, price, amount) {
  if (this.finishing) return this;
  this.eachBuilder(function (builder) {
    builder.add(time, price, amount);
  });
  return this;
};

/**
 * Tells the builders to finish up building and waits for all of them
 * to finish before emiting a finish event
 *
 * @return Harvester
 */

Harvester.prototype.finish = function () {
  if (this.finishing) return this;
  this.finishing = true;
  var self = this, count = 0, expected = 0;
  this.eachBuilder(function (builder) {
    if (!builder.inProgress()) return;
    expected++;
    builder.once('finish', function (candle) {
      if (++count >= expected) {
        self.emit('finish');
      }
    });
    builder.finish();
  });
  if (!expected) {
    this.emit('finish');
  }
  return this;
};

/**
 *
 * Adds a builder, binds a listener to the finish event on the builder
 * so we can emit a harvest event
 *
 * @param {Builder} builder
 * @return Harvester
 */

Harvester.prototype.addBuilder = function (builder) {
  var self = this, builders = this.getBuilders();
  if (!builders[builder.interval]) {
    builder.on('finish', function (candle) {
      self.emit('harvest', candle);
    });
    builders[builder.interval] = builder;
    this.builderCount++;
  }
  return this;
};

/**
 *
 * Initialize the builders
 *
 * @return Object
 */

Harvester.prototype.getBuilders = function () {
  if (!this.builders) {
    this.builders = {};
  }
  return this.builders;
};

/**
 * Processes each builder with the fn
 *
 * @param {Function} fn
 *
 * @return Harvester
 */

Harvester.prototype.eachBuilder = function (fn) {
  var builders = this.getBuilders();
  for (var k in builders) {
    fn(builders[k]);
  }
  return this;
};

module.exports = Harvester;

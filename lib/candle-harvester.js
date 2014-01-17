var util = require('util')
  , events = require('events')
  , candleBuilder = require('./candle-builder');

function Harvester () {
  events.EventEmitter.call(this);
  this.builders = {};
  this.builderCount = 0;
}

util.inherits(Harvester, events.EventEmitter);

Harvester.make = function () {
  return new Harvester();
};

Harvester.prototype.harvest = function (time, price, amount) {
  this.eachBuilder(function (builder) {
    builder.add(time, price, amount);
  });
};

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
};

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

Harvester.prototype.getBuilders = function () {
  if (!this.builders) {
    this.builders = {};
  }
  return this.builders;
};

Harvester.prototype.eachBuilder = function (fn) {
  var builders = this.getBuilders();
  for (var k in builders) {
    fn(builders[k]);
  }
  return this;
};

module.exports = Harvester;

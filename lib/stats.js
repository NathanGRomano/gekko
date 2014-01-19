var util = require('util')
  , events = require('events')
  ;

function Stats (points) {
  if (!(this instanceof Stats)) {
    return Stats.getInstance(points);
  }
  events.EventEmitter.call(this);
  this.addPoints(points);
}

util.inherits(Stats, events.EventEmitter);

Stats.make = function (points) {
  return new Stats(points);
};

Stats.getInstance = function (points) {
  if (!this.instance) {
    this.instance = this.make(points);
  }
  return this.instance;
};

Stats.prototype.getData = function () {
  if (!this.data) {
    this.data = {};
  }
  return this.data;
};

Stats.prototype.addPoints = function (points) {
  var data = this.getData();
  points = points || {};
  for (var k in points) {
    if (data[k]) {
      data[k] += points[k];
    }
    else {
      data[k] = points[k];
    }
  }
  return this;
};

Stats.prototype.track = function (point, value) {
  var data = this.getData();
  data[point] = (data[point] || 0) + (value || 1);
  this.emit('track', point);
  return this;
};

Stats.prototype.render = function (stream) {
  var data = this.getData();
  var stuff = [];
  for (var k in data) {
    stuff.push(k+': ' + data[k]);
  }
  if (stream && stream.write) {
    stream.write(stuff.join(' | ')+"\r")
  }
  else {
    process.stdout.write(stuff.join(' | ')+"\r");
  }
  return this;
};

Stats.prototype.zero = function () {
  var data = this.getData();
  for (var k in data) {
    data[k] = 0;
  }
  return this;
};

Stats.prototype.dump = function () {
  this.emit('dump', this.getData())
  this.data = null
  return this;
};

module.exports = Stats;

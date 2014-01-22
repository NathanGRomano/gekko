var util = require('util')
  , events = require('events')
  ;

function List (max) {
  events.EventEmitter.call(this);
  this.max(max);
}

util.inherits(List, events.EventEmitter);

List.prototype.max = function () {
  if (arguments.length) {
    if (typeof arguments[0] === 'number' && arguments[0] > 0) {
      this._max = arguments[0];
    }
    return this;
  }
  if (!this._max) {
    this._max = Infinity;
  }
  return this._max;
};

List.prototype.items = function () {
  if (!this._items) {
    this._items = [];
  }
  return this._items;
};

List.prototype.add = function (time, price, amount) {
  var candle = candle.make(time, price, amount);
  this.emit('new', candle);
  return this.addCandle(candle);
};

List.prototype.addCandle = function (candle) {
  var items = this.items();
  if (!items.length) {
    items.push(candle);
    this.emit('add', candle);
  }
  else {
    if (items[items.length-1].time < candle.time) {
      if (items.length + 1 > this.max()) {
        this.emit('remove', items.shift());
      }
      items.push(candle);
      this.emit('add', candle);
    }
  }
  return this;
};

List.prototype.get = function (index) {
  return this.items()[index];
};

List.prototype.size = function () {
  return this.items().length;
};

List.prototype.each = function (fn) {
  this.items().forEach(fn);
  return this;
};

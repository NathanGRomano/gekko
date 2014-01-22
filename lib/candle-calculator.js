var util = require('util')
  , events = require('events')
  ;

function Calculator (list) {
  events.EventEmitter.call(this);

  var self = this;

  list.on('remove', function () {
    self.emas().shift(); 
  });
  
  list.on('add', function () {
    self.calculate(); 
  });

  this.list = list;

}

util.inherits(Calculator, events.EventEmitter);

Calculator.prototype.emas = function () {
  if (!this._emas) {
    this._emas = [];
  }
  return this._emas;
};

Calculator.prototype.calculate = function () {

  var size = this.list.size();

  if (size < this.list.max()) {
    this.emit('need more candles');
    return;
  }

  var index = this.emas().length;

  if (index == 0) {
    var c = 0;
    this.list.each(function (candle) {
      c += candle.close;
    });
    c /= this.list.size();
    this.emas().push(c);
    index++;
  }
  
  var k = 2 / (size + 1);

  while (index < size) {
    this.emas()[index] = this.list.get(index).close * k + this.emas()[index-1] * (1 - k);
    index++;
  }

};

function DemoList (items, max) {
  events.EventEmitter.call(this);
  this.get = function (index) {
    return items[index]
  };

  this.size = function () {
    return items.length;
  };

  this.each = function (fn) {
    items.forEach(fn);
    return this;
  };

  this.max = function () {
    return max;
  };

  this.items = function () {
    return items;
  };

  this.add = function (i) {
    if (items.length + 1 > this.max()) {
      items.shift();
      this.emit('remove');
    }
    items.push(i);
    this.emit('add');
  }
}

util.inherits(DemoList, events.EventEmitter);
/*
var assert = require('assert');

var list = new DemoList(
  [
    { close: 10 },
    { close: 11 },
    { close: 12 },
    { close: 12 },
    { close: 15 },
    { close: 17 },
    { close: 20 },
    { close: 23 },
    { close: 25 },
    { close: 18 },
    { close: 19 },
    { close: 22 },
    { close: 24 },
  ],
  15
);

var c = new Calculator(list);
c.once('need more candles', function () {
  assert.equal(list.size() < list.max(), true);
});
c.calculate();

list.items().push({close: 24});
list.items().push({close: 25});
c.calculate();
var a = c.emas().slice(0);
assert(c.emas().length === list.size(), true);
c.calculate();
var b = c.emas().slice(0);
assert(a, b);
list.add({close:26});
var d = c.emas().slice(0);
assert(a[1], d[0]);
*/

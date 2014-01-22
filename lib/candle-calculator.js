var util = require('util')
  , events = require('events')
  , candleList = require('./candle-list')
  , candleSet = require('./candle-set')
  ;

function Calculator (list) {

  events.EventEmitter.call(this);

  this.list(list);

}

util.inherits(Calculator, events.EventEmitter);

/**
 * Creates a new Calculator given either a CandleList or CandleSet
 *
 * @param {mixed} *optional CandleList or CandleSet
 * @return Calculator
 */

Calculator.make = function (list) {
  return new Calculator(list);
};

/**
 * initializes the list of emas
 *
 * @param {Array} *optional
 * @return Array|Calculator
 */

Calculator.prototype.emas = function () {
  if (arguments.length === 0) {
    if (!this._emas) {
      this._emas = [];
    }
    return this._emas;
  }
  if (arguments[0] instanceof Array) {
    this._emas = arguments[0];
  }
  return this;
};

/**
 * Initializes our list of candles
 *
 * @param {mixed} *optional CandleList or CandleSet instance
 * @return CandleList|CandleSet|Calculator
 */

Calculator.prototype.list = function () {
  if (arguments.length === 0) {
    if (!this._list) {
      this._list = candleList.make();
    }
    return this._list;
  }
  if (arguments[0] instanceof candleList || arguments[0] instanceof candleSet || arguments[0] instanceof DemoList) {

    var list = arguments[0];

    if (this._list) {
      this._list.emit('detach');
    }

    var self = this
      , remove = function () {
          self.emas().shift();    
        }
      , add = function () {
          self.calculate(); 
        }
      , detach = function () {
          this.removeListener('remove', remove);
          this.removeListener('add', add);
          this.removeListener('detach', detach);
        }
      ;

    list.on('remove', remove);
    list.on('add', add);
    list.on('detach', detach);

    this._list = list;
  }
  return this;
};

/**
 * Begins a new calculation with our current set of data
 *
 * @return Calculator
 */

Calculator.prototype.calculate = function () {

  var self = this;

  Calculation
    .make(this.emas().slice(0), buildValues(this.list())) 
      .on('begin', function () {
        console.log('begin...');
        self.emit('begin', this);
      })
      .on('abort', function () {
        console.log('aborted...');
        self.emit('abort', this);
      })
      .on('end', function () {
        console.log('ended...');
        self.emas(this.emas);
        self.emit('calculation', this); 
      })
      .on('need more candles', function () {
        console.log('need more candles...');
        self.emit('need more candles', this);
      })
      .on('calculate', function () {
        console.log('calculate...');
        self.emit('calculate', this);
      })
      .on('calculating', function () {
        console.log('calculatin...');
        self.emit('calculating', this);
      })
      .begin();

  return this;
};


function Calculation (emas, values, max) {

  events.EventEmitter.call(this);

  var self = this;
  this.emas = emas || [];
  this.values = values || [];
  this.max = max || 1;
  this.k = 0; 

  this.on('calculate', function () {
    self.calculate();
  });
}

util.inherits(Calculation, events.EventEmitter);

/**
 * Makes a new calculation
 *
 * @param {array} emas
 * @param {array} values
 * @param {number} max
 */

Calculation.make = function (emas, values, max) {
  return new Calculation(emas, values, max);
};

/**
 * Starts the calculation
 */

Calculation.prototype.begin = function () {

  if (this.calculating)
    return this.emit('calculating');

  this.calculating = true;

  var size = this.values.length;

  if (size < this.max) {
    return this.emit('need more candles');
  }

  this.k = 2 / (size + 1);

  this.emit('begin');
  this.calculate();
};

/**
 * Calculates the current step
 */

Calculation.prototype.calculate = function () {
  if (!this.calculating) {
    return this.begin();
  }

  var index = this.emas.length;

  if (index === 0) {
    var c = 0;
    this.values.forEach(function (v) { c = c + v });
    c = c / this.values.length;
    this.emas[0] = c
    index++;
  }

  if (index < this.values.length) {
    this.emas[index] = this.values[index] * this.k + this.emas[index-1] * (1 - this.k);
    this.emit('calculate');
  }
  else {
    this.end();
  }
};

/**
 * Ends the calculation.
 */

Calculation.prototype.end = function () {
  if (this.calculating) {
    this.calculating = false;
    if (this.emas.length < this.values.length) {
      this.emit('abort');
    }
    else {
      this.emit('end');
    }
  }
};

function buildValues (list) {
  var values = [];
  list.each(function (candle) {
    values.push(candle.close);
  });
  console.log('values', values);
  return values;
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

var assert = require('assert');

var list = candleList.make(15);
list.addCandle({ time: 1, close: 10 });
list.addCandle({ time: 2, close: 11 });
list.addCandle({ time: 3, close: 12 });
list.addCandle({ time: 4, close: 12 });
list.addCandle({ time: 5, close: 15 });
list.addCandle({ time: 6, close: 17 });
list.addCandle({ time: 7, close: 20 });
list.addCandle({ time: 8, close: 23 });
list.addCandle({ time: 9, close: 25 });
list.addCandle({ time: 10, close: 18 });
list.addCandle({ time: 11, close: 19 });
list.addCandle({ time: 12, close: 22 });
list.addCandle({ time: 13, close: 24 });

Calculator.make(list)
  .once('need more candles', function () {
    assert.equal(list.size() < list.max(), true);
  })
  .calculate();

list.addCandle({time: 14, close: 24});
list.addCandle({time: 15, close: 25});

Calculator.make(list)
  .once('calculation', function () {
    assert(this.emas().length === list.size(), true);
  })
  .calculate();

  /*
var a = c.emas().slice(0);
c.calculate();
var b = c.emas().slice(0);
assert.equal(a, b);
list.add({close:26});
var d = c.emas().slice(0);
assert.equal(a[1], d[0]);
*/

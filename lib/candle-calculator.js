var util = require('util')
  , events = require('events')
  , candleList = require('./candle-list')
  , candleSet = require('./candle-set')
  , debug = function () { }
  ;

if (!module.parent) {
  debug = console.log;
}

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
      this.list(candleList.make());
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
          debug('added');
          self.emas().shift();    
        }
      , add = function () {
          debug('added');
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
    .make(this.emas().slice(0), buildValues(this.list()), this.list().max()) 
      .on('begin', function () {
        debug('begin...');
        self.emit('begin', this);
      })
      .on('abort', function () {
        debug('abort...');
        self.emit('abort', this);
      })
      .on('end', function () {
        debug('end...');
        self.emas(this.emas);
        self.emit('calculation', this); 
      })
      .on('need more candles', function () {
        debug('need more candles...');
        self.emit('need more candles', this);
      })
      .on('calculate', function () {
        self.emit('calculate', this);
      })
      .on('calculating', function () {
        debug('calculating...');
        self.emit('calculating', this);
      })
      .begin();

  return this;
};

function Calculation (emas, values, max) {

  events.EventEmitter.call(this);

  this.emas = emas || [];
  this.values = values || [];
  this.max = max || 1;
  this.k = 0; 

  this.on('calculate', function () {
    this.calculated = true;
    this.calculate();
  });

  this.on('end', function () {
    debug(this.emas);
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

  if (this.values.length < this.max) {
    return this.emit('need more candles');
  }

  this.calculated = false;
  this.calculating = true;

  this.k = 2 / (this.values.length + 1);

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

  if (this.emas.length === this.values.length && this.calculated) {
    return this.end();
  }

  if (this.emas.length === 0) {
    var c = 0;
    this.values.forEach(function (v) { c = c + v });
    c = c / this.values.length;
    this.emas[0] = c;
  } else if (this.emas.length < this.values.length) {
    this.emas[this.emas.length] = this.values[this.emas.length-1] * this.k + this.emas[this.emas.length-1] * (1 - this.k);
  } else if (this.emas.length === this.values.length) {
    this.emas[this.emas.length-1] = this.values[this.emas.length-1] * this.k + this.emas[this.emas.length-2] * (1 - this.k);
  }

  this.emit('calculate');
};

/**
 * Ends the calculation.
 */

Calculation.prototype.end = function () {
  if (this.calculating || !this.calculated) {
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
list.addCandle({time: 14, close: 24});

if (!module.parent) {

Calculator.make(list)
  .once('need more candles', function () {
    debug('need more candles');
    assert.equal(list.size() < list.max(), true);

    this.once('calculation', function () {

      debug('calculation emas.length should be equal to list.size()');
      assert.equal(this.emas().length === list.size(), true);

      var emas = this.emas().slice(0);

      this.once('calculation', function () {

        var self = this;
        debug('the previous ema should now be the first ema');
        assert.equal(this.emas()[0], emas[1]);

        debug('testing abort');
        list.max(1000000);

        var e = new events.EventEmitter();
        e.on('tick', function () {
          if (!this.running) return;
          this.i = this.i || 0;
          if (++this.i < 1000000) {
            list.addCandle({time:16+this.i, close:24+this.i});
            setImmediate(function () {
              e.emit('tick');
            });
          }
        });
        e.on('start', function () {
          debug('starting feed...');
          this.running = true;
          this.emit('tick');
        });
        e.on('stop', function() {
          this.running = false;
        });

        this.once('abort', function () {
          debug('we aborted...');
          assert.equal(e.running, false);
        });
        
        debug('setting timeout...');
        setTimeout(function () {
          self.once('need more candles', function (calculation) {
            e.emit('stop');
            debug('ending calculation...');
            calculation.end();
          });
        },1000);

        e.emit('start');
      });

      list.addCandle({time: 16, close:26});

    });

    list.addCandle({time: 15, close: 25});

  })
  .calculate();

}

var assert = require('assert')
  , util = require('util')
  , events = require('events')
  ;

function Poll () {
  events.EventEmitter.call(this);
}

util.inherits(Poll, events.EventEmitter);

Poll.make = function () {
  return new Poll();
};

Poll.prototype.on = function () {
  events.EventEmitter.prototype.on.apply(this, Array.prototype.slice.call(arguments));
  return this;
};

Poll.prototype.once = function () {
  events.EventEmitter.prototype.once.apply(this, Array.prototype.slice.call(arguments));
  return this;
};

Poll.prototype.start = function () {
  var self = this;

  if (this.running()) return this;
  this.emit('start');
  this._interval = setInterval(function () {
    self.tick();
  }, this.time())
  this.emit('started');
  this.tick();

  return this;
};

Poll.prototype.stop = function () {
  if (!this.running()) return this;
  this.emit('stop');
  clearInterval(this._interval);
  delete this._interval;
  this.emit('stopped');
  return this;
};

Poll.prototype.time = function () {
  if (arguments.length === 0) {
    if (typeof this._time !== 'number') {
      this._time = 60000;
    }
    return this._time;
  }
  var old = this._time;
  this._time = arguments[0];
  if (old !== this._time) {
    this.emit('interval');
    if (this.running()) {
      this.stop().start();
    }
  }
  return this;
};

Poll.prototype.running = function () {
  return typeof this._interval !== 'undefined';
};

Poll.prototype.tick = function () {

  var polling = false;

  this.polling = function () {
    return polling;
  };

  this.tick = function () {

    this.emit('tick');

    if (polling) {
      return this.emit('still polling');
    }
    
    polling = true;

    var self = this;

    this.emit('polling');
    this.emit('get data', function () {
      polling = false;
      var args = Array.prototype.slice.call(arguments);
      self.emit.apply(self, ['receive'].concat(args)); 
      self.receive.apply(self, Array.prototype.slice.call(arguments));  
    });

  };

  return this.tick();
};

Poll.prototype.polling = function () {
  return false;
};

Poll.prototype.receive = function () {
  var self = this, args = Array.prototype.slice.call(arguments), first = args[0];
  if (first instanceof Error) {
    return this.emit('error', first);
  }
  if (typeof first === 'object' && first instanceof Array) {
    first.forEach(function (item) {
      self.emit('handle', item);
    });
  }
  else {
    if (args.length >= 2 && (first === null || first === undefined)) {
      self.emit.apply(self, ['handle'].concat(args.slice(1)));
    }
    else {
      self.emit.apply(self, ['handle'].concat(args));
    }
  }
  return this;
};

module.exports = Poll;

var poll = new Poll();
poll.time(30);
poll.on('interval', function () {
  assert(this.interval(), 30);
});
poll.start();
poll.on('start', function () {
  assert.equal(this.running(), false);
});
poll.on('started', function () {
  assert.equal(this.running(), true);
});
poll.on('tick', function () {
  assert.equal(this.running(), true);
});
poll.on('polling', function () {
  assert.equal(this.polling(), true);
});
poll.on('get data', function (cb) {
  assert.equal(this.polling(), true);
  cb([1,2,3]);
});
poll.on('receive', function (data) {
  assert.equal(this.polling(), false);
  assert.equal(data instanceof Array, true);
  assert.equal(data[0], 1);
  assert.equal(data[1], 2);
  assert.equal(data[2], 3);
});
poll.on('handle', (function () {
  var count = 0;
  return function (item) {
    assert.equal(typeof item === 'number', true)
    assert.equal(++count, item);
  };
})());
poll.on('stop', function () {
  assert.equal(this.running(), true);
});
poll.on('stopped', function () {
  assert.equal(this.running(), false);
});
poll.stop();

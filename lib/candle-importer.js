var util = require('util')
  , events = require('events')
  , stream = require('stream')
  , async = require('async')
  , moment = require('moment')
  , csv = require('csv')
  , candleHarvester = require('./candle-harvester') 
  , candleBuilder = require('./candle-builder')
  ;

function Importer () {
  events.EventEmitter.call(this);
}

util.inherits(Importer, events.EventEmitter);

Importer.make = function (stream) {
  return new Importer(stream);
};

Importer.prototype.setModel = function (model) {
  this.model = model;
  return this;
};

Importer.prototype.getModel = function () {
  if (!this.model) {
    console.warn('Using default model class!');
    this.setModel(Default);
  }
  return this.model;
};

Importer.prototype.getQueue = function () {
  var self = this;
  if (!this.queue) {
    this.queue = async.queue(function (candle, cb) {
      var model = self.getModel()
        , instance = new model(candle.toObject());
      instance.save(function (err, doc) {
        if (err) {
          if (err.code === 11000) {
            self.emit('model duplicate', doc, candle);
          }
          else {
            self.emit('model save error', err);
          }
        }
        else {
          self.emit('model saved', doc);
        }
        cb();
      });
    });
  }
  return this.queue;
};

Importer.prototype.setHarvester = function (harvester) {
  var self = this;
  if (harvester instanceof candleHarvester) {
    if (this.harvester) {
      this.harvester.emit('detach');
    }

    var harvest = function (candle) {
      self.getQueue().push(candle);
    };
    harvester.on('harvest', harvest);

    var finish = function () {
      self.emit('harvest finished', harvester);
    }
    harvester.on('finish', finish);

    harvester.once('detach', function () {
      this.removeListener('harvest', harvest);
      this.removeListener('finish', finish);
    });

    this.harvester = harvester;
  }
  return this;
};

Importer.prototype.getHarvester = function () {
  if (!this.harvester) {
    var harvester = candleHarvester.make();
    harvester.addBuilder(candleBuilder.make(moment.duration(1,'year').valueOf()));
    harvester.addBuilder(candleBuilder.make(moment.duration(1,'month').valueOf()));
    harvester.addBuilder(candleBuilder.make(moment.duration(1,'week').valueOf()));
    harvester.addBuilder(candleBuilder.make(moment.duration(1,'day').valueOf()));
    harvester.addBuilder(candleBuilder.make(moment.duration(1,'hour').valueOf()));
    harvester.addBuilder(candleBuilder.make(moment.duration(30,'minutes').valueOf()));
    harvester.addBuilder(candleBuilder.make(moment.duration(15,'minutes').valueOf()));
    harvester.addBuilder(candleBuilder.make(moment.duration(10,'minutes').valueOf()));
    harvester.addBuilder(candleBuilder.make(moment.duration(5,'minutes').valueOf()));
    harvester.addBuilder(candleBuilder.make(moment.duration(1,'minutes').valueOf()));
    harvester.addBuilder(candleBuilder.make(moment.duration(30,'seconds').valueOf()));
    this.setHarvester(harvester);
  }
  return this.harvester;
};

Importer.prototype.getStreams = function () {
  if (!this.streams) {
    this.streams = [];
  }
  return this.streams;
};

Importer.prototype.hasStream = function (stream) {
  var streams = this.getStreams(), i=0;;
  for (i; i<streams.length; i++) {
    if (streams[i]._stream === stream) {
      return true;
    }
  }
  return false;
};

Importer.prototype.addStream = function (stream) {
  var self = this;
  if (!this.hasStream(stream)) {
    var c = csv()
      .from(stream)
      .on('record', function (record, index) {
        self.emit('record', record, index);
        self.getHarvester().harvest(moment.unix(Number(record[0])), Number(record[1]), Number(record[2]));
      })
      .on('end', function () {
        self.removeStream(stream);
        if (self.getStreams().length === 0) {
          self.finish();
        }
      })
      .stream = stream;
    this.getStreams().push(c);
  }
  return this;
};

Importer.prototype.finish = function () {
  var self = this;
  if (!this.finishing) {
    this.finishing = true;
  }
  self.getHarvester().finish();
  var interval = setInterval(function () {
    if (!self.getQueue().length()) {
      clearInterval(interval);
      self.emit('done');
      self.finishing = false;
    }
  }, 100);
}

/*
 * Default model
 */

function Default (properties) {
  for (var k in properties) {
    this[k] = properties;
  }
}

Default.prototype.save = function (fn) {
  var self = this;
  process.nextTick(function () {
    fn(null, self);
  });
};

Importer.DefaultModel = Default;

module.exports = Importer;

var candleSet = require('./candle-set')
  , candleList = require('./candle-list')
  , candleModel = require('./candle-model')
  , moment = require('moment')
  ; 

function Fetcher (model) {
  this.model = model || candleModel();
}

/**
 * Makes a new Fetcher given the model class
 *
 * @param {Function} model
 * @return Fetcher
 */

Fetcher.make = function (model) {
  return new Fetcher(model);
};

/**
 * Fetches the data and provides an array
 *
 * @param {object} query
 * @param {function} cb
 * @param {object} options
 * @return this
 */

Fetcher.prototype.fetch = function (query, cb, options) {
  options = options || { max: Infinity, interval: moment.duration(1,'hour') };
  var self = this
    , instance = null;
    , klass = null
    , handle = function (docs) {
        var obj = instance;
        if (!obj && klass) { 
          obj = klass.make(options.max);
        }
        docs.forEach(function (doc) {
          obj.addCandle(Candle.make().fromObject(doc));
        });
        cb(null, obj || docs);
      }
    , results = {
        list: function () {
          klass = candleList;
          return self;
        },
        set: function () {
          klass = candleSet;
          return self;
        },
        into: function (place) {
          instance = place; 
          return self;
        }
      }
    , next = function (err, docs) {
        if (err) return cb(err);
        handle(docs); 
      }
    ;
  this.model.find(query).sort({time:1}).exec(function (err, docs) {
    if (err) {
      return next(err);
    }
    next(err, docs);
  });
  return results;
};

module.exports = Fetcher;

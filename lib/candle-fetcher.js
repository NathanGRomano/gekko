var candleSet = require('./candle-set')
  , candleModel = require('./candle-model');

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
 * Fetches data given the query and a callback, if we want to merge
 * the data we pass "true" for merge and two or more candles with the
 * same interval and time will be merged
 *
 * @param {object} query
 * @param {function} cb
 * @param {boolean} merge *optional
 * @return this;
 */

Fetcher.prototype.fetch = function (query, cb, merge) {
  var set = candleSet.make();
  this.model.find(query).sort({time:1}).exec(function (err, docs) {
    if (err) {
      return cb(err);
    }
    docs.forEach(function (doc) {
      set.addCandle(candle.make().fromObject(doc),merge);
    });
    cb(null, set);
  });
  return this;
};

module.exports = Fetcher;

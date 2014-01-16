var candleSet = require('./candleSet');

function Fetcher (model) {
  this.model = model;
}

Fetcher.make = function (model) {
  return new Fetcher(model);
};

Fetcher.prototype.fetch = function (query, cb) {
  var set = candleSet.make();
  this.model.find(query).sort({time:1}).exec(function (err, docs) {
    if (err) {
      return cb(err);
    }
    docs.forEach(function (doc) {
      set.addCandle(candle.make().fromObject(doc));
    });
    cb(null, set);
  });
};

module.exports = Fetcher;

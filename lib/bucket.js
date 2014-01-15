var nearest = require('./nearest');

function Bucket (interval) {
  this.interval = interval;
  this.buckets = {};
}

Bucket.make = function (interval) {
  return new Bucket(interval);
};

Bucket.prototype.add = function (time, price, amount) {
  var bucket = this.getInterval(time);
  bucket.add(time, price, amount);
};

Bucket.prototype.getInterval = function (time) {
  var key = nearest(time).interval(this.interval);
  if (!this.buckets[key]) {
    this.buckets[key] = new Interval(key);
  }
  return this.buckets[key];
};

Bucket.prototype.compile = function () {
  var results = [];
  for (var k in this.buckets) {
    results.push(this.buckets[k].toObject());
  }
  return results;
};

Bucket.prototype.toCSV = function () {
  var lines = [];
  lines.push(['date', 'open', 'high', 'low', 'close', 'volume'].join(','));
  for (var k in this.buckets) {
    lines.push(this.buckets[k].toCSV());
  }
  return lines.join("\n");
};

function Interval (time) {
  this.empty = true;
  this.time = time;
  this.open = 0;
  this.high = 0;
  this.low = 0;
  this.close = 0;
  this.volume = 0;
  this._lowest_time = 0;
  this._highest_time = 0;
}

Interval.make = function (time) {
  return new Interval(time);
};

Interval.prototype.add = function (time, price, amount) {
  if (this.empty) {
    this._lowest_time = this._highest_time = time;
    this.low = this.high = this.open = this.close = price;
    this.empty = false;
  }
  else {
    if (time < this._lowest_time) {
      this.open = price;
      this._lowest_time = time;
    }
    else if (time > this._highest_time) {
      this.close = price;
      this._highest_time = time;
    }
    if (price < this.low) {
      this.low = price;
    }
    else if (price > this.high) {
      this.high = price;
    }
  }
  this.volume += amount;
};

Interval.prototype.toObject = function () {
  return {
    date: this.time,
    open: this.open,
    high: this.high,
    low: this.low,
    close: this.close,
    volume: this.volume
  };
};

Interval.prototype.toArray = function () {
  return [
    this.time,
    this.open,
    this.high,
    this.low,
    this.close,
    this.volume
  ]
};

Interval.prototype.toCSV = function () {
  return this.toArray().join(',');
};

Bucket.Interval = Interval;

module.exports = Bucket;

function Candle (time, interval) {
  this.empty = true;
  this.time = time;
  this.interval = interval;
  this.open = 0;
  this.high = 0;
  this.low = 0;
  this.close = 0;
  this.volume = 0;
  this._lowest_time = 0;
  this._highest_time = 0;
  this.created = Date.now();
}

Candle.make = function (time, interval) {
  return new Candle(time, interval);
};

Candle.prototype.add = function (time, price, amount) {
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

Candle.prototype.merge = function (candle) {
  if (this.open < candle.open) {
    this.open = candle.open;
  }
  if (this.high < candle.high) {
    this.high = candle.high;
  }
  if (this.low > candle.low) {
    this.low = candle.low;
  }
  if (this.open > candle.open) {
    this.open = candle.open;
  }
  if (this.close < candle.close) {

  }
  this.volume += candle.volume;
};

Candle.prototype.toObject = function () {
  return {
    date: this.time,
    interval: this.interval,
    open: this.open,
    high: this.high,
    low: this.low,
    close: this.close,
    volume: this.volume
  };
};

Candle.prototype.fromObject = function (doc) {
  var self = this;
  'date interval open high low close volume'.split(' ').forEach(function (key) {
    self[key] = doc[key] || self[key];
  });
};

Candle.prototype.toArray = function () {
  return [
    this.time,
    this.interval,
    this.open,
    this.high,
    this.low,
    this.close,
    this.volume
  ]
};

Candle.prototype.toCSV = function () {
  return this.toArray().join(',');
};

module.exports = Candle;

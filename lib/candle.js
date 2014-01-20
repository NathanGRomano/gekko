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

/**
 * Make a new instance
 *
 * @param {number} time 
 * @param {number} interval
 * @return Candle
 */

Candle.make = function (time, interval) {
  return new Candle(time, interval);
};

/**
 * Makes an instance from the passed object
 *
 * @param {object} data
 * @return Candle
 */

Candle.fromObject = function (data) {
  var candle = this.make().fromObject(data);
  candle.empty = (candle.open + candle.high + candle.low + candle.close + candle.volume) > 0;
  return candle;
};

/**
 * Adds the values into the candle
 *
 * @param {number} time
 * @param {number} price
 * @param {number} amount
 * @return Candle
 */

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
  return this;
};

/**
 * Merges one candle into this candle
 * 
 * @param {Candle} candle
 * @return Candle
 */

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
  return this;
};

/**
 * Takes our attributes and returns a plain old javascript object
 *
 * @return object
 */

Candle.prototype.toObject = function () {
  return {
    time: this.time,
    interval: this.interval,
    open: this.open,
    high: this.high,
    low: this.low,
    close: this.close,
    volume: this.volume
  };
};

/**
 * Populates us given a plain old object
 *
 * @param {object} doc
 * @return Candle
 */

Candle.prototype.fromObject = function (doc) {
  var self = this;
  'created time interval open high low close volume'.split(' ').forEach(function (key) {
    self[key] = doc[key] || self[key];
  });
  return this;
};

/**
 * Returns an array of our fields
 *
 * @return array
 */

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

/**
 * Converts our fields into a CSV like string
 *
 * @return string
 */

Candle.prototype.toCSV = function () {
  return this.toArray().join(',');
};

module.exports = Candle;

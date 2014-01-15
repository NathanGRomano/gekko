var assert = require('assert');

function Nearest (time) {
  if (!(this instanceof Nearest)) {
    return new Nearest(time);
  }
  this.time = time;
}

Nearest.prototype.day = function () {
  var d = new Date(this.time);
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d.getTime();
};

Nearest.prototype.hours = function (a) {
  if (typeof a !== 'number' || !a) a = 1;
  return this.interval(a*60*60*1000);
};

Nearest.prototype.minutes = function (a) {
  if (typeof a !== 'number' || !a) a = 1;
  return this.interval(a*60*1000);
};

Nearest.prototype.interval = function (interval) {
  return Math.floor(this.time/interval)*interval;
};

module.exports = Nearest;

var t = new Date(2014,0,15,13,36,23).getTime();
assert.equal(Nearest(t).day(),new Date(2014,0,15).getTime());
assert.equal(Nearest(t).hours(),new Date(2014,0,15,13).getTime());
assert.equal(Nearest(t).minutes(30),new Date(2014,0,15,13,30).getTime());
assert.equal(Nearest(t).minutes(15),new Date(2014,0,15,13,30).getTime());
assert.equal(Nearest(t).minutes(10),new Date(2014,0,15,13,30).getTime());
assert.equal(Nearest(t).minutes(5),new Date(2014,0,15,13,35).getTime());
assert.equal(Nearest(t).minutes(2),new Date(2014,0,15,13,36).getTime());
assert.equal(Nearest(t).minutes(1),new Date(2014,0,15,13,36).getTime());

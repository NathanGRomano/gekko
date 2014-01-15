var moment = require('moment')
  , csv = require('csv')
  , nearest = require('../lib/nearest')
  , bucket = require('../lib/bucket')
  ;

var buckets = {};
buckets.yearly = bucket.make(moment.duration(1,'year'));
buckets.monthly = bucket.make(moment.duration(1,'month'));
buckets.weekly = bucket.make(moment.duration(1,'week'));
buckets.daily = bucket.make(moment.duration(1,'day'));
buckets.hourly = bucket.make(moment.duration(1,'hour'));

var stdin = process.stdin;

stdin.resume();
stdin.setEncoding('utf8');

csv()
  .from(stdin)
  .on('record', function (row, index) {
    console.log('handling record: ' + index + '[' + row.join() + ']');
    for (var k in buckets) {
      buckets[k].add(row[0], row[1], row[2]);
    }
  })
  .on('close', function (count) {
    for (var k in buckets) {
      fs.writeFileSync(__dirname + '/' + k + '.csv', buckets.toCSV());
    }
    console.log('number of lines: ' + count);
  })
  .on('error', function (err) {
    console.error(err);
  });

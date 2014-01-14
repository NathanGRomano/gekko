/*
 *
 * polls bitcoin chart data and stores it into the database
 *
 * TODO just use the csv import if you already have the file
 * TODO this file should request the file from the api and import it
 *
 */
var http = require('https')
	, mongoose = require('mongoose')
  , config = require('../util').getConfig()

  , CSV = require("csv-string")
	;
mongoose.connect(config.mongodb.bitcoincharts.uri);

var Schema = new mongoose.Schema({
	p: Number,
	a: Number,
	ts: Number
});

var Trade = mongoose.model('Trade', Schema);

var rowCount = 0;
  var fs = require('fs');
  var fn = '/Users/nromano/Downloads/btceUSD.csv';

console.log('removing existing data...');
Trade.remove({}, function (err, res) {
  console.log('opening read stream to '+fn+'...');
  var stream = fs.createReadStream(fn, {flags:'r'});
  var data = ''
  stream.on('data', function (chunk) {
    console.log('chunk read...');
    data = data + chunk;
  });
  stream.on('end', function () {
    console.log('data read...');
    var rows = [];
    console.log('parsing data...');
    CSV.forEach(data, function (row, index) {
      console.log('parsed row: ' + index + '...');
      rows.push(function (cb) {
        console.log('storing row ' + index + '...');
        new Trade({
          t: row[0],
          p: row[1],
          a: row[2]
        }).save(function (err) {
          if (err) console.error(err);
          cb();
        });
      });
    });
    console.log('storing rows...');
    async.series(rows, function (err, res) {
      console.log('getting counts...');
      Trade.count(function (err, count) {
        if (err)
          console.error(err);
        else 
          console.log('Mongo Docs: ' + count + ' CSV Rows: ' + rowCount);
        console.log('done.');
        process.exit(0);
      });
    });
  });
});

/*
var req = http.request('http://api.bitcoincharts.com/v1/csv/btceUSD.csv', function (res) {
  res.setEncoding('utf-8');
  res.on('data', function (chunk) {
    console.log('chunk received...');
    CSV.readChunk(chunk, function (row) {
      console.log('row'); 
    });
  });
  res.on('end', function () {
    console.log('finished...');
  });
});

req.on('error', function (err) {
  console.error(err);
});

req.end();
*/


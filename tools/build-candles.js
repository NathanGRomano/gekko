var fs = require('fs')
  , mongoose = require('mongoose')
  , config = require('../util').getConfig()
  , candleImporter = require('../lib/candle-importer')
  , candleModel = require('../lib/candle-model')
  , stats = require('../lib/stats')
  ;

console.log('preparing mongo connection...');

mongoose.connection.on('open', function (err) {
  if (err) {
    console.error(err);
    process.exit(0);
  }

  console.log('opened...');

  stats({records:0, 'saved': 0, 'save errors': 0, 'duplicates': 0})
    .on('track', function () {
      this.render();
    });

  candleImporter.make()
    .addStream(fs.createReadStream('/Users/nromano/Downloads/btceUSD.csv',{flags:'r'}))
    .on('record', function () {
      stats().track('records');
    })
    .on('model save error', function () {
      stats().track('save errors');
    })
    .on('model saved', function () {
      stats().track('saved');
    })
    .on('model duplicate', function () {
      stats().track('duplicates');
    })
    .on('done', function () {
      console.log('closing mongo connection...');
      mongoose.disconnect() 
    });
});

mongoose.connection.once('close', function () {
  console.log('disconnected...');
  console.log('done.');
  process.exit(0);
});

console.log('opening mongo connection...');
mongoose.connect(config.mongodb.bitcoincharts.uri);


var fs = require('fs')
  , mongoose = require('mongoose')
  , config = require('../util').getConfig()
  , candleImporter = require('../lib/candle-importer')
  , stats = require('../lib/stats')
  ;

console.log('opening connection to mongodb...');

mongoose.connection.on('open', function (err) {

  if (err) return console.error(err);

  console.log('connected to mongodb...');

  stats({records:0, 'saved': 0, 'save errors': 0, 'duplicates': 0})
    .on('track', function () {
      this.render();
    });

  candleImporter.make()
    .setModel(mongoose.model('Candle', require('../lib/schema/candle')))
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
      mongoose.connection.once('close', function () {
        console.log('disconnected...');
        console.log('done.');
        process.exit(0);
      });
      mongoose.disconnect() 
    });

});

mongoose.connect(config.mongodb.bitcoincharts.uri);

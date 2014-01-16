var fs = require('fs')
  , events = require('events')
  , mongoose = require('mongoose')
  , config = require('../util').getConfig()
  , candleImporter = require('../lib/candle-importer')
  ;

mongoose.connect(config.mongodb.bitcoincharts.uri);

var stats = new events.EventEmitter();
stats.data = {'record':0, 'save error':0, 'saved':0, 'duplicate':0};
stats.track = function () {
  var args = Array.prototype.slice.call(arguments), self = this;
  args.forEach(function(arg) {
    self.emit('track', arg);
  });
};
stats.on('track', function (arg) {
  this.data[arg] = this.data[arg] || 0;
  this.data[arg]++;
  this.emit('render');
});
stats.on('render', function () {
  var output = [];
  for (var k in this.data) {
    output.push(k + ': ' + this.data[k]);
  }
  process.stdout.write(output.join(' ')+"\r");
});

console.log('Preparing...');

candleImporter.make()
  .setModel(mongoose.model('Candle', require('../lib/schema/candle')))
  .addStream(fs.createReadStream('/Users/nromano/Downloads/btceUSD.csv',{flags:'r'}))
  .on('record', function () {
    stats.track('record');
  })
  .on('model save error', function () {
    stats.track('save error');
  })
  .on('model saved', function () {
    stats.track('saved');
  })
  .on('model duplicate', function () {
    stats.track('duplicate');
  })
  .on('done', function () {
    mongoose.connection.once('close', function () {
      process.stdout.write('\n' + 'Records: ' + track.records + ' Failures: ' + track.failures + ' Duplicates: ' + track.duplicates + ' Successes: ' + track.successes + '\nDone.\n');
      process.exit(0);
    });
    mongoose.disconnect() 
  });


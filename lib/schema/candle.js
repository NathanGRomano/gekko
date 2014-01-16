var mongoose = require('mongoose');
var Schema = new mongoose.Schema({
    time: {type:Number, default: Date.now, required: true}
  , interval: {type:Number, required: true}
  , open: {type:Number, default: 0, required: true}
  , high: {type:Number, default: 0, required: true}
  , low: {type:Number, default: 0, required: true}
  , close: {type:Number, default: 0, required: true}
  , volume: {type:Number, default: 0, required: true}
  , created: {type:Date, default:Date.now, require: true}
});
Schema.index({time: 1});
Schema.index({created: 1});
module.exports = Schema;

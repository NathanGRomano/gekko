var mongoose = require('mongoose')
  , candle = require('./candle')
  , candleSchema = require('./candle-schema')
  ;

function Model (connection, name, schema, collectionName) {
  connection = connection || mongoose.connection;
  name = name || 'Candle';
  schema = schema || candleSchema;
  collectionName = collectionName || 'candles';
  if (!(this instanceof Model)) {
    if (Model.models[name]) {
      return Model.models[name];
    }
    else {
      return Model.make(connection);
    }
  }
  if (!connection) throw new Error('Mongoose connection is required!');
  this.connection = connection;
  this.name = name;
  this.schema = schema;
  this.model = this.connection.model(name, schema, collectionName);
  Model.models[name] = this;
}

/*
 * The model classes
 */

Model.models = {};

/**
 * Makes a new model class
 *
 * @param {Connection} connection *optional
 * @param {string} name *optional
 * @param {Schema} schema *optional
 * @param {string} collectionName *optional
 * @return Model
 */

Model.make = function (connection, name, schema, collectionName) {
  return new Model(connection, name, schema, collectionName);
};

/**
 * Makes a new instanceof the model
 *
 * @param {object} data
 * @return Mongoose.Model
 */

Model.prototype.make = function (candle) {
  return new this.model(candle.toObject());
};

/**
 * Unregisters the model
 */

Model.prototype.done = function () {
  delete Model.models[this.name];
};

module.exports = Model;

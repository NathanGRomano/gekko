var config = require('./util').getConfig();

if (config.useGrowl) {
  module.exports = require('growl');
}
else {
  module.exports = function () { };
}

var _ = require('underscore');

module.exports.formatArgs = function(args, freeform) {
  var formattedArgs = [];

  // Freeform arg should come first
  if (freeform) {
    formattedArgs.push(freeform);
  }

  // Only then structured args
  if (args && !_.isEmpty(args)) {
    for (var key in args) {
      var value = args[key];
      var keyValue = key + "=" + value;
      formattedArgs.push(keyValue);
    }
  }

  return "\"" + formattedArgs.join(" ") + "\"";
}

var exec = require('shelljs').exec;
var _ = require('underscore');
var format = require('util').format;
var utils = require('./utils');
var Q = require('q');

module.exports.AdHoc = function () {

  this.config = {};

  this.module = function (module) {
    this.config.module = module;
    return this;
  }

  this.args = function (args, freeform) {
    this.config.args = args;
    this.config.freeform = freeform;
    return this;
  }

  this.hosts = function (hosts) {
    this.config.hosts = hosts;
    return this;
  }

  this.validate = function () {
    var errors = [];
    var config = this.config;

    // Hosts are mandatory
    if (_.isUndefined(config.hosts) || _.isNull(config.hosts)) {
      errors.push('"hosts" must be specified');
    }

    // Module is mandatory
    if (_.isUndefined(config.module) || _.isNull(config.module)) {
      errors.push('"module" must be specified');
    }

    return errors;
  }

  this.exec = function () {
    // Validate execution configuration
    var errors = this.validate();
    if (errors.length > 0) {
      var error = new Error('Ansible execution was mis-configured');
      error.reason = errors;
      return Q.reject(error)
    }

    var deferred = Q.defer();

    var args = utils.formatArgs(this.config.args, this.config.freeform);
    var command = format("ansible %s -m %s -a %s", this.config.hosts, this.config.module, args);

    exec(command, function(code, output) {
      deferred.resolve({code: code, output: output});
    });

    return deferred.promise;
  }

}

module.exports.Playbook = function () {

}

var shelljs = require('shelljs');
var _ = require('underscore');
var format = require('util').format;
var inherits = require('util').inherits;
var utils = require('./utils');
var Q = require('q');

var AbstractAnsibleCommand = function() {}

AbstractAnsibleCommand.prototype = {

  exec: function(options) {
    // Validate execution configuration
    var errors = this.validate();
    if (errors.length > 0) {
      var error = new Error('Ansible execution was mis-configured');
      error.reason = errors;
      return Q.reject(error)
    }

    var deferred = Q.defer();

    var currentWorkingDir = null;
    if (options && options.cwd) {
      currentWorkingDir = shelljs.pwd();
      shelljs.cd(options.cwd);
    }
    shelljs.exec(this.compile(), function(code, output) {
      if (currentWorkingDir) {
        shelljs.cd(currentWorkingDir);
      }
      deferred.resolve({code: code, output: output});
    });

    return deferred.promise;
  }
}

var AdHoc = function() {

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

  this.compile = function() {
    var command = format("ansible %s -m %s", this.config.hosts, this.config.module);

    if (this.config.args || this.config.freeform) {
      var args = utils.formatArgs(this.config.args, this.config.freeform);
      command = command + " -a " + args;
    }

    return command;
  }

}

inherits(AdHoc, AbstractAnsibleCommand);

var Playbook = function () {

  this.config = {};

  this.playbook = function(playbook) {
    this.config.playbook = playbook;
    return this;
  }

  this.variables = function(variables) {
    this.config.variables = variables;
    return this;
  }

  this.validate = function() {
    var errors = [];

    // Playbook is mandatory
    if (_.isUndefined(this.config.playbook) || _.isNull(this.config.playbook)) {
      errors.push("'playbook' must be specified")
    }

    return errors;
  }

  this.compile = function() {
    var playbook = this.config.playbook + ".yml";
    var command = format("ansible-playbook %s", playbook);

    if (this.config.variables) {
      var args = utils.formatArgs(this.config.variables);
      command += " -e " + args;
    }

    return command
  }

}

inherits(Playbook, AbstractAnsibleCommand);

module.exports.AdHoc = AdHoc;
module.exports.Playbook = Playbook;

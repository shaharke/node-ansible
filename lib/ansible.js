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
    var opt = {};
    if(options && options.silent) {
        opt.silent = true;
    }
    shelljs.exec(this.compile(), opt, function(code, output) {
      if (currentWorkingDir) {
        shelljs.cd(currentWorkingDir);
      }
      deferred.resolve({code: code, output: output});
    });

    return deferred.promise;
  },

  forks: function(forks) {
    this.config.forks = forks;
    return this;
  },

  verbose: function(level) {
    this.config.verbose = level;
    return this;
  },

  user: function(user) {
    this.config.user = user;
    return this;
  },

  inventory: function(inventory) {
    this.config.inventory = inventory;
    return this;
  },

  su: function(su) {
    this.config.su = su;
    return this;
  },

  asSudo: function() {
    this.config.sudo = true;
    return this;
  },

  addParam: function(command, param, flag) {
    if (this.config[param]) {
      command = command + " -" + flag + " " + this.config[param];
    }
    return command;
  },

  addVerbose: function(command) {
    if (this.config.verbose) {
      command = command + " -" + this.config.verbose
    }
    return command;
  },

  addSudo: function(command) {
    if (this.config.sudo) {
      command = command + " -s";
    }
    return command;
  },

  commonCompile: function(command) {
    command = this.addParam(command, "forks", "f");
    command = this.addParam(command, "user", "u");
    command = this.addParam(command, "inventory", "i");
    command = this.addParam(command, "su", "U");
    command = this.addVerbose(command);
    command = this.addSudo(command);

    return command;
  }

}

var AdHoc = function() {

  this.config = {};

  this.module = function (module) {
    this.config.module = module;
    return this;
  }

  this.args = function (args, freeform) {
    if (!_.isObject(args)) {
      freeform = args;
      args = null;
    }

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

    command = this.commonCompile(command);

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

    command = this.commonCompile(command);

    return command
  }

}

inherits(Playbook, AbstractAnsibleCommand);

module.exports.AdHoc = AdHoc;
module.exports.Playbook = Playbook;

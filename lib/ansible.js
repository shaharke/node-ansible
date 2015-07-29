var exec = require('child_process');
var _ = require('underscore');
var inherits = require('util').inherits;
var utils = require('./utils');
var Q = require('q');

var AbstractAnsibleCommand = function() {}

AbstractAnsibleCommand.prototype = {

  exec: function(options, out, err) {
    // Validate execution configuration
    var errors = this.validate();
    if (errors.length > 0) {
      var error = new Error('Ansible execution was mis-configured');
      error.reason = errors;
      return Q.reject(error)
    }

    var deferred = Q.defer();

    var processOptions = { env: process.env };
    if (options && options.cwd) {
      processOptions.cwd = options.cwd;
    }

    var child = exec.spawn(this.commandName(), this.compileParams(), processOptions);

    child.stdout.on('data', function(data) {
      if (out) {
        out(data.toString());
      }
    });

    child.stderr.on('data', function(data) {
      if (err) {
        err(data.toString());
      }
    });

    child.on('close', function(code) {
      deferred.resolve({code: code});
    });

    child.on('exit', function(code) {
      if (code !== 0) {
        deferred.resolve({code: code});
        // this should really be rejected, but we don't change
        // how the library worked.
        // deferred.reject({code: code});
      }
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

  addParam: function(commandParams, param, flag) {
    if (this.config[param]) {
      commandParams = commandParams.concat('-' + flag, this.config[param]);
    }
    return commandParams;
  },

  addVerbose: function(commandParams) {
    if (this.config.verbose) {
      commandParams = commandParams.concat('-' + this.config.verbose);
    }
    return commandParams;
  },

  addSudo: function(commandParams) {
    if (this.config.sudo) {
      commandParams = commandParams.concat('-s');
    }
    return commandParams;
  },

  commonCompileParams: function(commandParams) {
    commandParams = this.addParam(commandParams, "forks", "f");
    commandParams = this.addParam(commandParams, "user", "u");
    commandParams = this.addParam(commandParams, "inventory", "i");
    commandParams = this.addParam(commandParams, "su", "U");
    commandParams = this.addVerbose(commandParams);
    commandParams = this.addSudo(commandParams);

    return commandParams;
  }

}

var AdHoc = function() {

  this.commandName = function() {
    return 'ansible';
  }

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

  this.compileParams = function() {
    var result = [
      this.config.hosts,
      '-m',
      this.config.module
    ];

    if (this.config.args || this.config.freeform) {
      var args = utils.formatArgs(this.config.args, this.config.freeform);
      result = result.concat('-a', args);
    }

    result = this.commonCompileParams(result);

    return result;
  }

}

inherits(AdHoc, AbstractAnsibleCommand);

var Playbook = function () {

  this.commandName = function() {
    return 'ansible-playbook';
  }

  this.config = {};

  this.askPass = function() {
    this.config.askPass = true;
    return this;
  }

  this.askSudoPass = function() {
    this.config.askSudoPass = true;
    return this;
  }

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

  this.compileParams = function() {
    var result = [
      this.config.playbook + ".yml"
    ];

    if (this.config.variables) {
      var args = utils.formatArgs(this.config.variables);
      result = result.concat('-e', args);
    }

    if (this.config.askPass) {
      result = result.concat('--ask-pass');
    }

    if (this.config.askSudoPass) {
      result = result.concat('--ask-sudo-pass');
    }

    result = this.commonCompileParams(result);

    return result;
  }
}

inherits(Playbook, AbstractAnsibleCommand);

module.exports.AdHoc = AdHoc;
module.exports.Playbook = Playbook;

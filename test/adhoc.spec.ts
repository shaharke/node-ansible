import { expect } from 'chai';
import * as chai from 'chai';
import { spy, stub } from 'sinon';
import { AdHoc, AnsibleError } from '../lib/ansible';
import "mocha";
import { EventEmitter } from 'events';

import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';

import * as child_process from 'child_process';


var mockSpawn = require('mock-spawn');

chai.use(sinonChai);
chai.use(chaiAsPromised);

var mySpawn:any;

describe('AdHoc command', function() {
  before(function() {        
  })

  beforeEach(function() {
    mySpawn = mockSpawn();
    mySpawn.setStrategy( (command:string, args:any, opts:any) => {
      //console.log('command: ' + command, args, opts);
      return null;
    });
    require('child_process').spawn = mySpawn
  })

  describe('with no structured args and freeform arg', function() {

    it('should be translated successfully to ansible command', function(done) {
      var command = new AdHoc().module('shell').hosts('local').args("echo 'hello'");
      command.exec().then(() => {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible');
        expect(mySpawn.calls[0].args).to.deep.equal(['local', '-m', 'shell', '-a', 'echo \'hello\'']);
        done();
      }).catch((err) => {
        done(err);
      });
    })
  })
  describe('with no hosts', function() {

    it('should be rejected', function() {
      var command = new AdHoc().module('shell').args("echo 'hello'");
      expect(command.exec()).to.be.rejected;
    })

    it('should include reason in rejection', function(done) {
      var command = new AdHoc().module('shell').args(undefined, "echo 'hello'");
      command.exec().then( res => {
        done("should not be resolved");
      }).catch((error:AnsibleError) => {
        expect(error).to.have.property('reason');
        if( error.reason === undefined ) {
          done("reason is undefined");
          return;
        }
        expect(error.reason.length).to.eql(1);
        expect(error.reason[0]).to.include('hosts');
        done();
      })
    })
  })

  describe('with no module', function() {
    it('should be rejected', function() {
      var command = new AdHoc().hosts('local').args("echo 'hello'");
      expect(command.exec()).to.be.rejected;
    })

  })

  describe('with forks', function() {
    it('should contain forks flag in execution', (done) =>{
      var command = new AdHoc().module('shell').hosts('local').args("echo 'hello'").forks(10);
      command.exec().then(() =>{
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible');
        expect(mySpawn.calls[0].args).to.deep.equal(['local', '-m', 'shell', '-a', 'echo \'hello\'', '-f', 10]);
        done();
      }).catch((err) => { 
        done(err);
      });
    })
  })

  describe('with verbose', function() {
    it('should contain verbose flag in execution', (done) => {
      var command = new AdHoc().module('shell').hosts('local').args("echo 'hello'").verbose("vvv");
      command.exec().then(() => {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible');
        expect(mySpawn.calls[0].args).to.deep.equal(['local', '-m', 'shell', '-a', 'echo \'hello\'', '-vvv']);
        done();
      });
    })
  })

  describe('with user', function() {

    it('should contain user flag in execution', function(done) {
      var command = new AdHoc().module('shell').hosts('local').args("echo 'hello'").user("root");
      command.exec().then( () => {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible');
        expect(mySpawn.calls[0].args).to.deep.equal(['local', '-m', 'shell', '-a', 'echo \'hello\'', '-u', 'root']);
        done();
      }).catch((err) => { 
        done(err);
      });
    })
  })

  describe('as sudo user', function() {

    it('should contain sudo user flag in execution', function(done) {
      var command = new AdHoc().module('shell').hosts('local').args("echo 'hello'").asSudo();
      command.exec().then(() => {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible');
        expect(mySpawn.calls[0].args).to.deep.equal(['local', '-m', 'shell', '-a', 'echo \'hello\'', '-s']);
        done();
      }).catch((err) => {
        done(err);
      });
    })
  })

  describe('with sudo user specified', function() {

    it('should contain sudo user flag in execution', function(done) {
      var command = new AdHoc().module('shell').hosts('local').args("echo 'hello'").su('root');
      command.exec().then(() => {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible');
        expect(mySpawn.calls[0].args).to.deep.equal(['local', '-m', 'shell', '-a', 'echo \'hello\'', '-U', 'root']);
        done();
      }).catch((err) => {
        done(err);
      });
    })
  })

  describe('with inventory', function() {

    it('should contain inventory flag in execution', function(done) {
      var command = new AdHoc().module('shell').hosts('local').args("echo 'hello'").inventory("/etc/my/hosts");
      command.exec().then(() => {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible');
        expect(mySpawn.calls[0].args).to.deep.equal(['local', '-m', 'shell', '-a', 'echo \'hello\'', '-i', '/etc/my/hosts']);
        done();
      }).catch((err) => {
        done(err);
      });
    })
  })

  describe('with inventory subset', function() {

    it('should execute the playbook with specified inventory subset limit', function (done) {
      var command = new AdHoc().module('shell').hosts('local').inventory('/etc/my/hosts').limit('localhost').args("echo 'hello'");
      command.exec().then(() => {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible');
        expect(mySpawn.calls[0].args).to.deep.equal(['local', '-m', 'shell', '-a', 'echo \'hello\'', '-i', '/etc/my/hosts', '-l', 'localhost']);
        done();
      }).catch((err) => {
        done(err);
      });
    })

  })

  describe('with private key', function() {

    it('should contain private key flag in execution', function(done) {
      var command = new AdHoc().module('shell').hosts('local').args("echo 'hello'").privateKey("/home/user/.ssh/id_rsa");
      command.exec().then(() => {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible');
        expect(mySpawn.calls[0].args).to.deep.equal(['local', '-m', 'shell', '-a', 'echo \'hello\'', '--private-key', '"/home/user/.ssh/id_rsa"']);
        done();
      });
    })
  })

  after(function() {
  })

})

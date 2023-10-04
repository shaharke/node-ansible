import { expect } from 'chai';
import * as chai from 'chai';
import { spy, stub } from 'sinon';
import { AdHoc, AnsibleError, Playbook } from '../lib/ansible';
import "mocha";
import { EventEmitter } from 'events';

import * as path from 'path';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';

import * as child_process from 'child_process';

var mockSpawn = require('mock-spawn');

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Playbook command', function () {

  var mySpawn:any;


  before(function () {
  })

  beforeEach(function() {
    mySpawn = mockSpawn();
    mySpawn.setStrategy( (command:string, args:any, opts:any) => {
      //console.log('command: ' + command, args, opts);
      return null;
    });
    require('child_process').spawn = mySpawn
  })

  describe('with only playbook', function () {

    it('should execute the playbook', function (done) {
      var command = new Playbook().playbook('test');
      command.exec().then(() => {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml'] );
        done();
      }).catch((err) => {
        done(err);
      });
    })

  })

  describe('with variables', function () {
    
    it('should execute the playbook with the given variables', function (done) {
      var command = new Playbook().playbook('test').variables({foo: "bar"});
      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal( ['test.yml', '-e', '{"foo":"bar"}']);
        done();
      }).catch( err => {
        done(err);
      })
    })

    it('should execute the playbook with the given complex variables', function (done) {
      const variable = { 
        foo: {
          bar: ["shu"]
        } 
      };
      var command = new Playbook().playbook('test').variables(variable);

      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', '-e', '{"foo":{"bar":["shu"]}}']);
        done();
      }).catch( err => {
        done(err);
      });
    })

  })

  describe('with forks', function() {

    it('should execute the playbook with forks param as specified', function (done) {
      var command = new Playbook().playbook('test').forks(10);
      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', '-f', 10]);
        done();
      }).catch( err => {
        done(err);
      });
    })

  })

  describe('with verbose', function() {

    it('should execute the playbook with verbosity level', function (done) {
      var command = new Playbook().playbook('test').verbose("vv");
      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', '-vv']);
        done();
      }).catch( err => {
        done(err);
      });
    })

  })

  describe('with user', function() {

    it('should execute the playbook with specified user', function (done) {
      var command = new Playbook().playbook('test').user("root");
      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', '-u', 'root']);
        done();
      }).catch( err => {
        done(err);
      });
    })

  })

  describe('with sudo user specified', function() {

    it('should execute the playbook with specified sudo user', function (done) {
      var command = new Playbook().playbook('test').su("root");
      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', '-U', 'root']);
        done();
      }).catch( err => {  
        done(err);
      });
    })

  })

  describe('as sudo user', function() {

    it('should execute the playbook with sudo user flag', function (done) {
      var command = new Playbook().playbook('test').asSudo();
      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', '-s']);
        done();
      }).catch( err => {
        done(err);
      });
    })

  })

  describe('with inventory', function() {

    it('should execute the playbook with specified inventory', function (done) {
      var command = new Playbook().playbook('test').inventory("/etc/my/hosts");
      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', '-i', '/etc/my/hosts']);
        done();
      }).catch( err => {
        done(err);
      });
    })

  })

  describe('with inventory subset', function() {

    it('should execute the playbook with specified inventory subset limit', function (done) {
      var command = new Playbook().playbook('test').limit("localhost");
      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', '-l', 'localhost']);
        done();
      }).catch( err => {
        done(err);
      });
    })

  })

  describe('with private-key', function() {

    it('should execute the playbook with specified private key', function (done) {
      var command = new Playbook().playbook('test').privateKey("/home/user/.ssh/id_rsa");
      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', '--private-key', '"/home/user/.ssh/id_rsa"']);
        done();
      }).catch( err => {
        done(err);
      });
    })

  })

  describe('with working directory', function () {    

    it('should change to working directory during execution', function (done) {
      var command = new Playbook().playbook('test');
      var workingDir = path.resolve(__dirname, './fixtures');
      var options = { cwd: workingDir }
      var promise = command.exec(options);
      promise.then(function () { 
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml']);
        expect(mySpawn.calls[0].opts.cwd).to.eql( workingDir );
        expect(mySpawn.calls[0].opts.env).to.have.deep.property( "PYTHONUNBUFFERED", "1" );
        done();
      }).catch( err => {
        done(err);
      });
    })

  })

  describe('unbuffered output', function () {

    it('should default to unbuffered', function (done) {
      var command = new Playbook().playbook('test');
      var promise = command.exec();
      promise.then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml']);
        expect(mySpawn.calls[0].opts.env).to.have.deep.property( "PYTHONUNBUFFERED", "1" );
        done();
      }).catch( err => {
        done(err);
      });      
    })
    it('should turn on buffering when told to', function (done) {
      var command = new Playbook().playbook('test');
      var promise = command.exec({buffered:true});
      promise.then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml']);
        expect(mySpawn.calls[0].opts.env).to.have.deep.property( "PYTHONUNBUFFERED", "" );
        done();
      }).catch( err => {
        done(err);
      });
    })

  })

  describe('with --ask-pass flag', function() {

    it('should execute the playbook with --ask-pass flag', function (done) {
      var command = new Playbook().playbook('test').askPass();
      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', '--ask-pass']);
        done();
      }).catch( err => {
        done(err);
      });
    })
  })

  describe('with --ask-sudo-pass flag', function() {

    it('should execute the playbook with --ask-sudo-pass flag', function (done) {
      var command = new Playbook().playbook('test').askSudoPass();

      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', '--ask-sudo-pass']);
        done();
      }).catch( err => {
        done(err);
      });
    })
  })

  describe('with --tags param', function() {

    it('should execute the playbook with --tags', function (done) {
      var command = new Playbook().playbook('test').tags('onetag');

      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', "--tags=onetag"]);
        done();
      }).catch( err => {
        done(err);
      });
    })
  
    it('should execute the playbook with multiple --tags', function (done) {
      var command = new Playbook().playbook('test').tags('onetag','twotags');
  
      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', "--tags=onetag,twotags"]);
        done();
      }).catch( err => {
        done(err);
      });
    })
 
    /*it('should execute the playbook with array of --tags', function (done) {
      var command = new Playbook().playbook('test').tags(['onetag','twotags']);
 
      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', "--tags=onetag,twotags"]);
        done();
      }).catch( err => {
        done(err);
      });      
    })*/
  })

  describe('with --skip-tags param', function() {

    it('should execute the playbook with --skip-tags', function (done) {
      var command = new Playbook().playbook('test').skipTags('onetag');

      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', '--skip-tags=onetag']);
        done();
      }).catch( err => {
        done(err);
      });
    })

    it('should execute the playbook with multiple --skip-tags', function (done) {
      var command = new Playbook().playbook('test').skipTags('onetag','twotags');

      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', '--skip-tags=onetag,twotags']);
        done();
      }).catch( err => {
        done(err);
      });
    })

    /*it('should execute the playbook with array of --skip-tags', function (done) {
      var command = new Playbook().playbook('test').skipTags(['one tag','twotags']);

      command.exec().then(function () {
        expect(mySpawn.calls.length).to.equal(1);
        expect(mySpawn.calls[0].command).to.equal('ansible-playbook');
        expect(mySpawn.calls[0].args).to.deep.equal(['test.yml', '--skip-tags=one tag,twotags']);
        done();
      }).catch( err => {
        done(err);
      });      
    })*/
  })

  after(function () {
  })
})

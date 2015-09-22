var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var sinonChai = require("sinon-chai");
var chaiAsPromised = require('chai-as-promised');
var process = require('child_process');
var mockSpawn = require('mock-spawn');

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Playbook command', function () {

  var mySpawn = mockSpawn();
  var oldSpawn = process.spawn;
  var spawnSpy;

  before(function () {
    process.spawn = mySpawn;
    spawnSpy = sinon.spy(process, 'spawn');
  })

  beforeEach(function() {
    spawnSpy.reset();
  })

  var Playbook = require("../index").Playbook;

  describe('with only playbook', function () {

    it('should execute the playbook', function (done) {
      var command = new Playbook().playbook('test');
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml'], {});
        done();
      }).done();
    })

  })

  describe('with variables', function () {

    it('should execute the playbook with the given variables', function (done) {
      var command = new Playbook().playbook('test').variables({foo: "bar"});
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', '-e', '{"foo":"bar"}'], {});
        done();
      }).done();
    })

    it('should execute the playbook with the given complex variables', function (done) {
      variable = { 
        foo: {
          bar: ["shu"]
        } 
      };
      var command = new Playbook().playbook('test').variables(variable);

      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', '-e', '{"foo":{"bar":["shu"]}}'], {});
        done();
      }).done();
    })

  })

  describe('with forks', function() {

    it('should execute the playbook with forks param as specified', function (done) {
      var command = new Playbook().playbook('test').forks(10);
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', '-f', 10], {});
        done();
      }).done();
    })

  })

  describe('with verbose', function() {

    it('should execute the playbook with verbosity level', function (done) {
      var command = new Playbook().playbook('test').verbose("vv");
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', '-vv'], {});
        done();
      }).done();
    })

  })

  describe('with user', function() {

    it('should execute the playbook with specified user', function (done) {
      var command = new Playbook().playbook('test').user("root");
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', '-u', 'root'], {});
        done();
      }).done();
    })

  })

  describe('with sudo user specified', function() {

    it('should execute the playbook with specified sudo user', function (done) {
      var command = new Playbook().playbook('test').su("root");
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', '-U', 'root'], {});
        done();
      }).done();
    })

  })

  describe('as sudo user', function() {

    it('should execute the playbook with sudo user flag', function (done) {
      var command = new Playbook().playbook('test').asSudo();
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', '-s'], {});
        done();
      }).done();
    })

  })

  describe('with inventory', function() {

    it('should execute the playbook with specified inventory', function (done) {
      var command = new Playbook().playbook('test').inventory("/etc/my/hosts");
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook' ,['test.yml', '-i', '/etc/my/hosts'], {});
        done();
      }).done();
    })

  })

  describe('with working directory', function () {

    var path = require('path');

    it('should change to working directory during execution', function (done) {
      var command = new Playbook().playbook('test');
      var workingDir = path.resolve(__dirname, './fixtures');
      var promise = command.exec({cwd: workingDir});
      expect(promise).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml'], {cwd: workingDir});
        done();
      }).done();
    })

  })

  describe('with --ask-pass flag', function() {

    it('should execute the playbook with --ask-pass flag', function (done) {
      var command = new Playbook().playbook('test').askPass();
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', '--ask-pass'], {});
        done();
      }).done();
    })
  })

  describe('with --ask-sudo-pass flag', function() {

    it('should execute the playbook with --ask-sudo-pass flag', function (done) {
      var command = new Playbook().playbook('test').askSudoPass();

      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', '--ask-sudo-pass'], {});
        done();
      }).done();
    })
  })

  describe('with --tags param', function() {

    it('should execute the playbook with --tags', function (done) {
      var command = new Playbook().playbook('test').tags('onetag');

      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', "--tags=onetag"], {});
        done();
      }).done();
    })
  
    it('should execute the playbook with multiple --tags', function (done) {
      var command = new Playbook().playbook('test').tags('onetag','twotags');
  
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', "--tags=onetag,twotags"], {});
        done();
      }).done();
    })
 
    it('should execute the playbook with array of --tags', function (done) {
      var command = new Playbook().playbook('test').tags(['onetag','twotags']);
 
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', "--tags=onetag,twotags"], {});
        done();
      }).done();
    })
  })

  describe('with --skip-tags param', function() {

    it('should execute the playbook with --skip-tags', function (done) {
      var command = new Playbook().playbook('test').skipTags('onetag');

      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', '--skip-tags=onetag'], {});
        done();
      }).done();
    })

    it('should execute the playbook with multiple --skip-tags', function (done) {
      var command = new Playbook().playbook('test').skipTags('onetag','twotags');

      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', '--skip-tags=onetag,twotags'], {});
        done();
      }).done();
    })

    it('should execute the playbook with array of --skip-tags', function (done) {
      var command = new Playbook().playbook('test').skipTags(['one tag','twotags']);

      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(spawnSpy).to.be.calledWith('ansible-playbook', ['test.yml', '--skip-tags=one tag,twotags'], {});
        done();
      }).done();
    })
  })

  after(function () {
    process.spawn = oldSpawn;
    spawnSpy.restore();
  })

})

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var sinonChai = require("sinon-chai");
var chaiAsPromised = require('chai-as-promised');
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Playbook command', function () {

  var execSpy;

  before(function () {
    execSpy = sinon.spy(require('shelljs'), 'exec');
  })

  beforeEach(function() {
    execSpy.reset();
  })

  var Playbook = require("../index").Playbook;

  describe('with only playbook', function () {

    it('should execute the playbook', function (done) {
      var command = new Playbook().playbook('test');
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(execSpy).to.be.calledWith('ansible-playbook test.yml');
        done();
      }).done();
    })

  })

  describe('with variables', function () {

    it('should execute the playbook with the given variables', function (done) {
      var command = new Playbook().playbook('test').variables({foo: "bar"});
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(execSpy).to.be.calledWith('ansible-playbook test.yml -e "foo=bar"');
        done();
      }).done();
    })

  })

  describe('with forks', function() {

    it('should execute the playbook with forks param as specified', function (done) {
      var command = new Playbook().playbook('test').forks(10);
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(execSpy).to.be.calledWith('ansible-playbook test.yml -f 10');
        done();
      }).done();
    })

  })

  describe('with verbose', function() {

    it('should execute the playbook with verbosity level', function (done) {
      var command = new Playbook().playbook('test').verbose("vv");
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(execSpy).to.be.calledWith('ansible-playbook test.yml -vv');
        done();
      }).done();
    })

  })

  describe('with user', function() {

    it('should execute the playbook with specified user', function (done) {
      var command = new Playbook().playbook('test').user("root");
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(execSpy).to.be.calledWith('ansible-playbook test.yml -u root');
        done();
      }).done();
    })

  })

  describe('with sudo user specified', function() {

    it('should execute the playbook with specified sudo user', function (done) {
      var command = new Playbook().playbook('test').su("root");
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(execSpy).to.be.calledWith('ansible-playbook test.yml -U root');
        done();
      }).done();
    })

  })

  describe('as sudo user', function() {

    it('should execute the playbook with sudo user flag', function (done) {
      var command = new Playbook().playbook('test').asSudo();
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(execSpy).to.be.calledWith('ansible-playbook test.yml -s');
        done();
      }).done();
    })

  })

  describe('with inventory', function() {

    it('should execute the playbook with specified inventory', function (done) {
      var command = new Playbook().playbook('test').inventory("/etc/my/hosts");
      expect(command.exec()).to.be.fulfilled.then(function () {
        expect(execSpy).to.be.calledWith('ansible-playbook test.yml -i /etc/my/hosts');
        done();
      }).done();
    })

  })

  describe('with working directory', function () {

    var path = require('path');
    var cdSpy;

    before(function() {
      cdSpy = sinon.spy(require('shelljs'), 'cd');
    })

    it('should change to working directory during execution', function (done) {
      var command = new Playbook().playbook('test');
      var workingDir = path.resolve(__dirname, './fixtures');
      var promise = command.exec({cwd: workingDir});
      expect(promise).to.be.fulfilled.then(function () {
        expect(cdSpy).to.be.calledTwice
        expect(cdSpy).to.be.calledWith(workingDir);
        done();
      }).done();
    })

    after(function() {
      cdSpy.restore();
    })
  })

  after(function () {
    execSpy.restore();
  })

})

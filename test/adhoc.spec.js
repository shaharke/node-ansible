var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var sinonChai = require("sinon-chai");
var chaiAsPromised = require('chai-as-promised');
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('AdHoc command', function() {

  var execSpy

  before(function() {
    execSpy = sinon.spy(require('shelljs'), 'exec');
  })

  beforeEach(function() {
    execSpy.reset();
  })

  var AdHoc = require("../index").AdHoc;

  describe('with no structured args and freeform arg', function() {

    it('should be translated successfully to ansible command', function(done) {
      var command = new AdHoc().module('shell').hosts('local').args(null, "echo 'hello'");
      expect(command.exec()).to.be.fulfilled.then(function() {
        expect(execSpy).to.be.calledWith('ansible local -m shell -a "echo \'hello\'"');
        done();
      }).done();
    })

  })

  describe('with no hosts', function() {

    it('should be rejected', function() {
      var command = new AdHoc().module('shell').args(null, "echo 'hello'");
      expect(command.exec()).to.be.rejected;
    })

    it('should include reason in rejection', function(done) {
      var command = new AdHoc().module('shell').args(null, "echo 'hello'");
      expect(command.exec()).to.be.rejected.then(function(error) {
        expect(error).to.have.property('reason');
        expect(error.reason).to.be.array;
        expect(error.reason).to.have.length(1);
        done();
      })
    })

  })

  describe('with no module', function() {

    it('should be rejected', function() {
      var command = new AdHoc().hosts('local').args(null, "echo 'hello'");
      expect(command.exec()).to.be.rejected;
    })

  })

  describe('with forks', function() {

    it('should contain forks flag in execution', function(done) {
      var command = new AdHoc().module('shell').hosts('local').args(null, "echo 'hello'").forks(10);
      expect(command.exec()).to.be.fulfilled.then(function() {
        expect(execSpy).to.be.calledWith('ansible local -m shell -a "echo \'hello\'" -f 10');
        done();
      }).done();
    })
  })

  describe('with verbose', function() {

    it('should contain verbose flag in execution', function(done) {
      var command = new AdHoc().module('shell').hosts('local').args(null, "echo 'hello'").verbose("vvv");
      expect(command.exec()).to.be.fulfilled.then(function() {
        expect(execSpy).to.be.calledWith('ansible local -m shell -a "echo \'hello\'" -vvv');
        done();
      }).done();
    })
  })

  describe('with user', function() {

    it('should contain user flag in execution', function(done) {
      var command = new AdHoc().module('shell').hosts('local').args(null, "echo 'hello'").user("root");
      expect(command.exec()).to.be.fulfilled.then(function() {
        expect(execSpy).to.be.calledWith('ansible local -m shell -a "echo \'hello\'" -u root');
        done();
      }).done();
    })
  })

  after(function() {
    execSpy.restore();
  })

})

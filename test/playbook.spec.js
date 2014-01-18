var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var sinonChai = require("sinon-chai");
var chaiAsPromised = require('chai-as-promised');
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Playbook command', function() {

  var execSpy;

  before(function() {
    execSpy = sinon.spy(require('shelljs'), 'exec');
  })

  var Playbook = require("../index").Ansible.Playbook;

  describe('with only playbook', function() {

    it('should execute the playbook', function(done) {
      var command = new Playbook().playbook('test');
      expect(command.exec()).to.be.fulfilled.then(function() {
        expect(execSpy).to.be.calledWith('ansible-playbook test.yml');
        done();
      }).done();
    })

  })

  describe('with variables', function() {

    it('should execute the playbook with the given variables', function(done) {
      var command = new Playbook().playbook('test').variables({foo: "bar"});
      expect(command.exec()).to.be.fulfilled.then(function() {
        expect(execSpy).to.be.calledWith('ansible-playbook test.yml -e "foo=bar"');
        done();
      }).done();
    })

  })

  after(function() {
    execSpy.restore();
  })

})

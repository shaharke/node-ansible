// test for buffered and unbuffered output

var Path = require('path');
var Playbook = require("../index").Playbook;

var playbook_file = Path.join(__dirname, '..', 'test', 'fixtures', 'buffering')
var inventory_file = Path.join(__dirname, '..', 'test', 'fixtures', 'hosts')

var command = new Playbook().playbook( playbook_file );
command.inventory( inventory_file );
command.on('stdout', function(data) { console.log("stdout unb: "+data.toString()); });
command.on('stderr', function(data) { console.log("stderr unb: "+data.toString()); });
var promise = command.exec({buffered: false});

var commandb = new Playbook().playbook( playbook_file );
commandb.inventory( inventory_file );
commandb.on('stdout', function(data) { console.log("stdout buf: "+data.toString()); });
commandb.on('stderr', function(data) { console.log("stderr buf: "+data.toString()); });

promise.then(function(result){
  console.log("unbuf: "+result.output);
  console.log("unbuf: "+result.code);
  throw new Error('can you see me?');
  return commandb.exec({buffered:true});
}).then(function(result){
  console.log("buff:  "+result.output);
  console.log("buff:  "+result.code);
})//.catch(function(error){
//  console.log("error!",error)
//})


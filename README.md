node-ansible [![Build Status](https://travis-ci.org/shaharke/node-ansible.png?branch=master)](https://travis-ci.org/shaharke/node-ansible)
============

Programmatic interface in Node.js for executing Ansible ad-hoc commands and playbooks

#### Warning: this package is still under development. API might break between minors.

### Installation

`npm install node-ansible --save`

**NOTE:** I think it goes without saying, but I'll mention it anyway - you MUST have ansible installed on the same machine
on which your node process is going to run.


### Crash Course

```javascript
var Ansible = require('node-ansible');
var command = new Ansible.AdHoc().module('shell').hosts('local').args("echo 'hello'");
command.exec(
  {},
  function(out) { console.log(out); },
  function(err) { console.log(err); }
);
```

is equivalent to:

```shell
ansible local -m shell -a "echo 'hello'"
```

```javascript
var playbook = new Ansible.Playbook().playbook('my-playbook');
playbook.exec(
  {},
  function(out) { console.log(out); },
  function(err) { console.log(err); }
);
```

is equivalent to:

```shell
ansible-playbook myplaybook.yml
```

Let's execute:

```javascript
var promise = playbook.exec(
  {},
  function(out) { console.log(out); },
  function(err) { console.log(err); }
);
promise.then(function(successResult) {
  console.log(successResult.code); // Exit code of the executed command
}, function(error) {
  console.error(error);
})
```

[Full Documentation](http://shaharke.github.io/node-ansible)

### Running tests:

`npm test`

### License

[MIT](https://github.com/shaharke/node-ansible/blob/master/LICENSE)

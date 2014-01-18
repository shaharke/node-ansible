node-ansible [![Build Status](https://travis-ci.org/shaharke/node-ansible.png?branch=develop)](https://travis-ci.org/shaharke/node-ansible)
============

Programmatic interface in Node.js for executing Ansible ad-hoc commands and playbooks

# Installation

`npm install node-ansible --save`

# Usage

`var Ansible = require('node-ansible');`

## Ad-Hoc Commands

```javascript
var command = new Ansible.AdHoc().module('shell').hosts('local').args(null, "echo 'hello'");
command.exec();
```

The above code will be translated to the following CLI line:
`ansible local -m shell -a "echo 'hello'"`

## Playbooks

```javascript
var playbook = new Ansible.Playbook().playbook('myplaybook');
playbook.exec();
```

The above code will be translated to the following CLI line:
`ansible-playbook myplaybook.yml`
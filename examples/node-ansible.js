var Ansible = require('node-ansible');


//  Ansible supports two types of execution methods via its CLI: **ad-hoc** tasks and **playbooks**. node-ansible uses the
//  builder pattern to provide a programmatic interface above Ansible's CLI, that supports both methods.

//  ### Ad-hoc tasks
new Ansible.AdHoc().hosts('prod-servers').module('ping');


//  The command above will use Ansible to ping all hosts under the `prod-servers` group. As we said,
//  node-ansible only wraps Ansible's CLI tool, so the above code in fact translates to the following shell execution:
//  ```
//  > ansible prod-servers -m ping
//  ```
//
//  Most modules accept and even require arguments when executed. The following line of code will build an ad-hoc
//  executor for the `shell` module and pass a freeform argument to it:

new Ansible.AdHoc().hosts('prod-servers').module('shell').args('echo "hello world"');

//  Again, the command above actually translates to the following shell execution:
//  ```shell
//  > ansible prod-servers -m shell -a 'echo "hello world"'
//  ```

//  Obviously, node-ansible must support key-value arguments which are very common in Ansible modules.
//  With node-ansible you can simply use JSON objects to represent key-value arguments:

new Ansible.AdHoc().hosts('prod-servers')
                   .module('shell')
                   .args({ chdir: "/tmp" }, 'echo "hello world"');

//  ### Playbooks
//  A probably more interesting use-case is the execution of playbooks. Building a playbook command in node-ansible is
//  very similar to building ad-hoc commands:
new Ansible.Playbook().playbook('my-playbook');

//  The command above translates to the following shell execution: `ansible-playbook my-playbook.yml`.
//  Playbook variables can be set as follows:
var command = new Ansible.Playbook().playbook('my-playbook')
                                    .variables({ foo: 'bar' });

//  which translates to the following shell execution:
//  ```
//  > ansible-playbook my-playbook.yml -e 'foo=bar'
//  ```

//  ### Executing
//  Lets execute our command:
var promise = command.exec();

//  The exec command returns a [promise](http://promises-aplus.github.io/promises-spec/) object, from which we can
//  get the result of the execution:
promise.then(function(result) {
  console.log(result.code);
  console.log(result.output);
})

//  An execution result contains the exit code of the ansible CLI execution and its output (Ansible
//  pipes stderr to stdout)

//  Notice that the path of my-playbook.yml will be resolved relatively to the working directory of your node process. In many
//  cases that won't be preferable, in which case it is possible to explicitly set the working directory when executing the command:
command.exec({cwd:"/path/to/my/playbooks"})

//  Most of the flags available in the CLI can be set or turned on using builder functions available for both Playbook
//  and Ad-Hoc commands:

//  -f 4
command.forks(4)
//  -u root
command.user('root')
//  -i /etc/ansible/hosts
command.inventory('/etc/ansible/hosts')
//  -U root
command.su('root');
//  -s
command.asSudo();
// verbose level: accepts any level supported by the CLI
command.verbose('v')


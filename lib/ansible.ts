import { SpawnOptions, spawn } from "child_process";
import { EventEmitter } from "events";

export type Args = {
    [key: string]: string|number|boolean;
};
interface Config {
    module?: string;
    hosts?: string;
    args?: Args;
    freeform?: string;
    verbose?: string;
    playbook?: string;
    variables?: any;
    askPass?: boolean;
    askSudoPass?: boolean;
    sudo?: boolean;
    tags?: string[];
    forks?: boolean;
    user?: string;
    inventory?: any;
    limit?: string;
    su?: string;
    privateKey?: string;
    skipTags?: string[];
}
export class AnsibleError extends Error {
    constructor(message: string, reason?: string[]) {
        super(message);
        this.name = "AnsibleError";
        this.reason = reason;
    }
    readonly reason?: string[];
}

export abstract class AbstractAnsibleCommand extends EventEmitter {
    config: Config = {
    };
    abstract validate() : string[];
    abstract commandName(): string;
    abstract compileParams(): string[];

    constructor() {
        super();
    }
    exec = (options?: {buffered?:boolean, cwd?: string}): Promise<AnsibleError| { code: number|null, output: string }> => {
        return new Promise((resolve, reject) => {
            // Validate execution configuration
            var errors = this.validate();
            var self = this;
            if (errors.length > 0) {
                var error = new AnsibleError('Ansible execution was mis-configured', errors);   
                return reject(error)
            }

            var processOptions: SpawnOptions = {};
            if (!options) options = {};

            if (options.cwd) {
                processOptions.cwd = options.cwd;
            }

            // Make Ansible output unbuffered so the stdout and stderr `data` events
            // pickup output up more regularly
            
            processOptions.env = process.env;
            if( processOptions.env === undefined ) {
                processOptions.env = {};
            }
            if(options.buffered !== true) {
                processOptions.env["PYTHONUNBUFFERED"] = "1";    
            } else {
                processOptions.env["PYTHONUNBUFFERED"] = "";
            }

            var output = '';
            var child = spawn(this.commandName(), this.compileParams(), processOptions);
            if (child.stdout === null || child.stderr === null) {
                var error = new AnsibleError('Failed to spawn ansible process');
                return reject(error)
            }
            child.stdout.on('data', function (data) {
                output += data.toString();
                self.emit('stdout', data);
            });

            child.stderr.on('data', function (data) {
                output += data.toString();
                self.emit('stderr', data);
            });

            child.on('close', function (code) {
                self.emit('close', code);
                resolve({ code: code, output: output });
            });

            child.on('exit', function (code) {
                if (code !== 0) {
                    reject(new Error(output));
                }
            });
        });

    };

    forks = (forks: any) => {
        this.config.forks = forks;
        return this;
    };

    verbose = (level:string) => {
        this.config.verbose = level;
        return this;
    };

    user = (user:string) => {
        this.config.user = user;
        return this;
    };

    inventory = (inventory:string) => {
        this.config.inventory = inventory;
        return this;
    };

    privateKey = (privateKey:string) => {
        this.config.privateKey = privateKey;
        return this;
    };

    limit = (limit:string) => {
        this.config.limit = limit;
        return this;
    };

    su = (su:string) => {
        this.config.su = su;
        return this;
    };

    asSudo = () => {
        this.config.sudo = true;
        return this;
    };

    addParam = (commandParams:string[], param:string, flag:string) => {        
        const p = (this.config as any)[param]
        if (p) {
            return this.addParamValue(commandParams, p, flag)
        }
        return commandParams;
    };

    addParamValue = (commandParams:string[], value:any, flag:string) => {
        commandParams = commandParams.concat('-' + flag, value);
        return commandParams;
    }

    addPathParam = (commandParams:string[], param:string, flag:string) => {
        const p = (this.config as any)[param]
        if (p) {
            return this.addParamValue(commandParams, '"' + p + '"', flag);
        }
        return commandParams;
    };

    addVerbose = (commandParams:string[]) => {
        if (this.config.verbose) {
            commandParams = commandParams.concat('-' + this.config.verbose);
        }
        return commandParams;
    };

    addSudo = (commandParams: string[]):string[] => {
        if (this.config.sudo) {
            commandParams = commandParams.concat('-s');
        }
        return commandParams;
    };

    commonCompileParams = (commandParams:string[]) => {
        commandParams = this.addParam(commandParams, "forks", "f");
        commandParams = this.addParam(commandParams, "user", "u");
        commandParams = this.addParam(commandParams, "inventory", "i");
        commandParams = this.addParam(commandParams, "limit", "l");
        commandParams = this.addParam(commandParams, "su", "U");
        commandParams = this.addPathParam(commandParams, "privateKey", "-private-key");
        commandParams = this.addVerbose(commandParams);
        commandParams = this.addSudo(commandParams);

        return commandParams;
    };
}

export class AdHoc extends AbstractAnsibleCommand {
    constructor() {
        super();
    }
    validate = () => {
        var errors: string[] = [];
        var config = this.config;

        // Hosts are mandatory
        if (config.hosts === undefined || config.hosts === null) {
            errors.push('hosts" must be specified');
        }

        // Module is mandatory
        if (config.module === undefined || config.module === null) {
            errors.push('module" must be specified');
        }
        return errors;
    }

    commandName = (): string => {
        return 'ansible';
    }


    module = (module:string) => {
        this.config.module = module;
        return this;
    }

    args = (args: Args | string| undefined, freeform?: string) => {
        if (typeof args !== 'object') {
            this.config.args = undefined;
            this.config.freeform = args;
        } else {
            this.config.args = args;
            this.config.freeform = freeform;
        }
        return this;
    }

    hosts = (hosts: string) => {
        this.config.hosts = hosts;
        return this;
    }



    compileParams = () : string[] => {
        var result: string[] = [
            this.config.hosts!,
            '-m',
            this.config.module!
        ];

        if (this.config.args || this.config.freeform) {
            var args = formatArgs(this.config.args, this.config.freeform);
            if( args !== undefined ) {
                result.push('-a')
                result.push(args);
            }
        }
        result = this.commonCompileParams(result);
        return result;
    }

}

export class Playbook extends AbstractAnsibleCommand{
    constructor() {
        super();
    }

    commandName = ():string => {
        return 'ansible-playbook';
    }

    askPass = () => {
        this.config.askPass = true;
        return this;
    }

    askSudoPass = () => {
        this.config.askSudoPass = true;
        return this;
    }

    playbook = (playbook: any) =>  {
        this.config.playbook = playbook;
        return this;
    }

    variables = (variables: any) => {
        this.config.variables = variables;
        return this;
    }

      
    tags = (...args: string[]) => {
        this.config.tags = args;
        return this;
    }

    skipTags = (...args: string[]) => {
        this.config.skipTags = args;
        return this;
    }

    addTags = () => {
        if( this.config.tags === undefined || this.config.tags === null) {
            return '';
        }
        return ('--tags=' + this.config.tags.join(','));
    }

    addSkipTags = () => {
        if( this.config.skipTags === undefined || this.config.skipTags === null) {
            return '';
        }
        return ('--skip-tags=' + this.config.skipTags.join(','));
    }

    validate = () => {
        var errors:string[] = [];

        // Playbook is mandatory
        if (this.config.playbook === undefined || this.config.playbook === null) {
            errors.push("'playbook' must be specified")
        }

        return errors;
    }

    compileParams = () : string[] => {
        var result = [
            this.config.playbook + ".yml"
        ];

        if (this.config.variables) {
            var args = JSON.stringify(this.config.variables);
            result = result.concat('-e', args);
        }

        if (this.config.askPass) {
            result = result.concat('--ask-pass');
        }

        if (this.config.askSudoPass) {
            result = result.concat('--ask-sudo-pass');
        }

        if (this.config.tags) {
            var tags = this.addTags();
            result = result.concat(tags);
        }

        if (this.config.skipTags) {
            var skipTags = this.addSkipTags();
            result = result.concat(skipTags);
        }

        result = this.commonCompileParams(result);

        return result;
    }
}


const formatArgs = (args?: Args, freeform?: string): string | undefined => {
    var formattedArgs: string[] = [];

    // Freeform arg should come first
    if (freeform) {
        formattedArgs.push(freeform);
    }

    // Only then structured args
    if (args) {
        for (const key in Object.keys(args)) {
            var value = args[key];
            var keyValue = key + "=" + value;
            formattedArgs.push(keyValue);
        }
    }

    if (formattedArgs.length > 0) {
        return formattedArgs.join(" ");
    }

    return undefined;
}
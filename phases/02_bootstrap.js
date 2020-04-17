const EventEmitter = require("events")
const fs = require("fs").promises;
const stripJson = require("strip-json-comments");
const spawn = require("child_process").spawn;

async function bootstrap(emitter) {
    // read in infrastructure.json
    try {
        var path = __dirname + "/../run/config/infrastructure.json"
        var content = await fs.readFile(path, "utf-8")
    } catch (error) {
        if (error.code === "ENOENT") {
            emitter.emit("log", `No file found at ${path}`)
            emitter.emit("done", 1)
            return
        }
        emitter.emit("log", error)
        emitter.emit("done", 1)
        return
    }

    // convert to object
    const cleanedJson = stripJson(content)
    const infra = JSON.parse(cleanedJson)
    emitter.emit("log", `Infrastructure definition: ${JSON.stringify(infra)}`)

    // create var file
    let ymlString = getYml(infra.aws, infra.machines)
    try {
        path = __dirname + "/../run/vars/02_bootstrap.yml"
        await fs.writeFile(path, ymlString)
    } catch (error) {
        emitter.emit("log", error)
        emitter.emit("done", 1)
        return
    }
    emitter.emit("log", `Boostrap playbook vars:\n${ymlString}`)

    // start and run playbook
    emitter.emit("log", "Starting playbook")
    const playbookPath = __dirname + "/../playbooks/02_bootstrap.yml"
    const varPath = __dirname + "/../run/vars/02_bootstrap.yml"

    try {
        await fs.access(playbookPath)
    } catch (error) {
        emitter.emit("log", `Playbook could not be started as ${playbookPath} does not exist`)
        emitter.emit("done", 1)
        return
    }

    try {
        await fs.access(varPath)
    } catch (error) {
        emitter.emit("log", `Playbook could not be started as ${varPath} does not exist`)
        emitter.emit("done", 1)
        return
    }

    const playbook = spawn("ansible-playbook",
        ["--ssh-common-args=\"-o StrictHostKeyChecking=no\"", playbookPath, `--extra-vars=@${varPath}`]);

    // forward playbook events
    playbook.stdout.on("data", data => { emitter.emit("playlog", `${data}`); });
    playbook.on('error', (err) => { emitter.emit("log", `${err.message}`); });
    playbook.on("close", code => { 
        emitter._process = undefined // so that it can be run again
        emitter.emit("done", code) 
    });

    return playbook
}

function getYml(aws, machines) {
    let ymlString = `---
ec2_region: ${aws.ec2_region}
ssh_key_name: ${aws.ssh_key_name}
machines:`

    machines.forEach(machine => {
        ymlString = ymlString + `
- machine_name: ${machine.machine_name}
  type: ${machine.type}
  image: ${machine.image}`
    });

    return ymlString + "\n"
}

/**
 * Offers three kinds of events:
 *  - log: bootstrapping function whishes to log something
 *  - playlog: playbook logs something
 *  - done: bootstrapping is finished, codes see below
 * 
 * Codes
 *  *0* -- OK or no hosts matches
 *  *1* -- Error
 *  *2* -- One or more hosts failed
 *  *3* -- One or more hosts were unreachable
 *  *4* -- Parser error
 *  *5* -- Bad or incomplete options
 *  *99* -- User interrupted execution
 *  *250* -- Unexpected error
 */
module.exports = class Bootstrap extends EventEmitter {

    constructor() {
        super();

        /**
         * Start bootstrapping the infrastructure.
         * Does nothing if bootstrapping is already in process.
         */
        this.start = function () {
            if (!this._process) {
                this._process = bootstrap(this)
            } else {
                this.emit("log", `Bootstrapping already in process`)
            }
        }

        /**
         * Stop and interrupt the bootstrapping process.
         * Does nothing if not bootstrapping is in process.
         */
        this.stop = function () {
            if (this._process) {
                this._process.then(p => { p.kill("SIGINT") })
                this._process = undefined
            } else {
                this.emit("log", `Bootstrapping is currently not in process`)
            }
        }
    }

}
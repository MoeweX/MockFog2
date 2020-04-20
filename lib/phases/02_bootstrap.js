const EventEmitter = require("events")
const fs = require("fs")
const stripJson = require("strip-json-comments")
const spawn = require("child_process").spawn

const conf = require("../config.js")
const infra = require("../data/infrastructure.js")

async function bootstrap(emitter) {
    // start and run playbook
    emitter.emit("log", "Beginning Bootstrapping")
    const playbookPath = conf.playbookDir + "02_bootstrap.yml"
    const varPath = conf.playbookVarDir + "02_bootstrap.yml"

    try {
        await fs.promises.access(playbookPath)
    } catch (error) {
        emitter.emit("log", `Playbook could not be started as ${playbookPath} does not exist`)
        emitter.emit("done", 1)
        return
    }

    try {
        await fs.promises.access(varPath)
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

// errors should stop program, so do not catch
path = conf.playbookVarDir + "02_bootstrap.yml"
fs.writeFileSync(path, infra.ymlString)
console.log("Bootstrap playbook vars written to " + path)

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
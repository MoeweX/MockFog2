const fs = require("fs")
const spawn = require("child_process").spawn
const EventEmitter = require("events")

/**
 * 
 * Check whether all files necessary for playbook execution are available.
 * 
 * @param {String} playbookPath - path to the playbook file
 * @param {String} varPath - path to the var file for the given playbook
 * @returns true, if all files exists
 */
async function checkFiles(playbookPath, varPath) {
    try {
        await fs.promises.access(playbookPath)
    } catch (error) {
        console.log(`Playbook could not be started as ${playbookPath} does not exist`)
        return false
    }

    try {
        await fs.promises.access(varPath)
    } catch (error) {
        console.log(`Playbook could not be started as ${varPath} does not exist`)
        return false
    }

    return true
}

/**
 * Emits two kinds of events:
 *  - playlog: playbook logs something
 *  - done: playbook execution is finished, codes see below
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
class Playbook extends EventEmitter {

    constructor(playbookPath, varPath) {
        super();
        this.playbookPath = playbookPath
        this.varPath = varPath
    }

    /**
     * Start executing the defined playbook.
     * Does nothing if the playbook is already executed.
     * 
     * @returns true, if process has been newly started.
     */
    start() {
        if (!this._process) {
            console.log("Starting Playbook " + this.playbookPath)
            this._process = spawn("ansible-playbook", ["--ssh-common-args=\"-o StrictHostKeyChecking=no\"", this.playbookPath, `--extra-vars=@${this.varPath}`])

            // forward playbook events
            this._process.stdout.on("data", data => { this.emit("playlog", `${data}`) })
            this._process.on('error', (err) => { console.log(err) })
            this._process.on("close", code => { 
                this._process = undefined // so that it can be run again
                this.emit("done", code) 
            });

            return true
        } else {
            console.log(`Playbook ${this.playbookPath} is already being executed`)
            return false
        }
    }

    /**
     * Stop and interrupt the execution of the playbook.
     * Does nothing if no playbook was being executed.
     * 
     * @returns true, if a playbook execution was stopped.
     */
    stop() {
        if (this._process) {
            console.log("Stopping Playbook " + this.playbookPath)
            this._process.kill("SIGINT")
            this._process = undefined
            return true
        } else {
            console.log(`Playbook ${this.playbookPath} is not currently being executed`)
            return false
        }
    }

}

module.exports = {
    checkFiles: checkFiles,
    Playbook: Playbook
}
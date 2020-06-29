const common = require("./common.js")
const fs = require("fs")

const logService = require("../services/logService.js")

class Phase {

    constructor(phaseName) {
        this.phaseName = phaseName
        this.logger = logService(phaseName)
    }

    async parseInput() {
        this.logger.debug(`Phase ${this.phaseName} has no parseInput implementation`)
    }

    async runPrePlaybookTasks() {
        this.logger.debug(`Phase ${this.phaseName} has no runPrePlaybookTasks implementation`)
    }

    async executePlaybook() {
        // check all dependencies
        const ready = await common.checkFiles(this.playbookPath, this.varPath)
        if (!ready) { throw `Mandatory files for ${this.phaseName} playbook do not exist.` }

        const phase = this // as "this" is something else below
        return new Promise(resolve => {
            fs.unlink(this.playbookLogPath, function(err) {
                // err can be ignored, if it did not exist -> fine

                phase.playbook.on("playlog", function(data) {
                    phase.logger.silly(data)
                    fs.appendFile(phase.playbookLogPath, data, { "flag": "a+" }, (err) => { if (err) throw err})
                })

                phase.playbook.on("done", function(data) {
                    phase.logger.info(`${phase.phaseName} done, exit code is: ${data}`)
                    resolve()
                })

                phase.playbook.start()
            })
        })
    }

    async runPostPlaybookTasks() {
        this.logger.debug(`Phase ${this.phaseName} has no runPostPlaybookTasks implementation`)
    }

    async cleanUp() {
        this.logger.debug(`Phase ${this.phaseName} has no cleanUp implementation`)
    }

}

module.exports = Phase
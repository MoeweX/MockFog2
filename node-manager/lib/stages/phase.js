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

    async runPrePlaybookTasks(actionFunction) {
        this.logger.debug(`Phase ${this.phaseName} has no runPrePlaybookTasks implementation`)
    }

    async executePlaybook() {
        // check all dependencies
        const ready = await common.checkFiles(this.playbookPath, this.varPath)
        if (!ready) { throw "Mandatory files for bootstrapping playbook do not exist." }

        const phase = this // in callback, this is something else
        fs.unlink(this.playbookLogPath, function(err) {
            // err can be ignored, if it did not exist -> fine

            phase.playbook.on("playlog", function(data) {
                phase.logger.verbose(data)
                fs.appendFile(phase.playbookLogPath, data, { "flag": "a+" }, (err) => { if (err) throw err})
            })

            phase.playbook.on("done", function(data) {
                logger.info("Bootstrap done, exit code is: " + data)
                return "done"
            })

            phase.playbook.start()
        })
    }

    async runPostPlaybookTasks(actionFunction) {
        this.logger.debug(`Phase ${this.phaseName} has no runPostPlaybookTasks implementation`)
    }

    async cleanUp(actionFunction) {
        this.logger.debug(`Phase ${this.phaseName} has no cleanUp implementation`)
    }

}

module.exports = Phase
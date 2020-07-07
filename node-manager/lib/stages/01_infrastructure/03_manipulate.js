const fs = require("fs")
const fsp = fs.promises

const infrastructure = require("../../data/infrastructure.js")
const machineMeta = require("../../data/machine-meta.js")

const Phase = require("../phase.js")
const naService = require("../../services/nodeAgentService.js")
const manipulationService = require("../../services/manipulationService.js")

const conf = require("../../config.js")

class Child extends Phase {

    constructor(phaseName) {
        super(phaseName)
    }

    async parseInput() {
        this.infra = infrastructure()
        this.machineMeta = machineMeta()
        manipulationService.fetch()
        this.tcconfigs = manipulationService.getTCConfigs(this.infra, this.machineMeta)
    }

    async runPrePlaybookTasks() {
        // write tcconfig file for each machine
        for (const machine_name in this.tcconfigs) {
            const tcconfig = JSON.stringify(this.tcconfigs[machine_name], null, "\t")
            const tcconfigFolder = conf.runMachinesDir + machine_name
            conf.checkFolderExists(tcconfigFolder)
            const tcconfigPath = tcconfigFolder + "/tcconfig.json"

            await fsp.writeFile(tcconfigPath, tcconfig)
            this.logger.info("Wrote tcconfig for " + machine_name + " to " + tcconfigPath)
        }
    }

    async executePlaybook() {
        this.logger.debug(`Phase ${this.phaseName} has no executePlaybook implementation`)
    }

    async runPostPlaybookTasks() {
        // send current tcconfig to each agent
        await naService.distributeTCConfigs(this.machineMeta, this.tcconfigs)
    }

}

module.exports = Child

if (require.main === module) {
    (async () => {
        const child = new Child("Destroy")

        await child.parseInput()
        await child.runPrePlaybookTasks()
        await child.executePlaybook()
        await child.runPostPlaybookTasks()
        await child.cleanUp()
    })();
}

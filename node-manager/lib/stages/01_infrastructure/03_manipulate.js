const fs = require("fs")
const fsp = fs.promises
const http = require('http')


const infrastructure = require("../../data/infrastructure.js")
const machineMeta = require("../../data/machine-meta.js")
const multiFileFunctions = require("../../data/multi-file.js")

const common = require("../common.js")
const Phase = require("../phase.js")

const conf = require("../../config.js")

class Child extends Phase {

    constructor(phaseName) {
        super(phaseName)
    }

    async parseInput() {
        this.infra = infrastructure()
        this.machineMeta = machineMeta()
        this.tcconfigs = multiFileFunctions.getTCConfigs(this.infra, this.machineMeta)
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
        const phase = this
        var replyCount = 0

        // send current tcconfig to each agent
        return new Promise((resolve) => {
            for (const machine_name in phase.tcconfigs) {
                const ip = phase.machineMeta.getPublicIP(machine_name)
                const tcconfig = JSON.stringify(phase.tcconfigs[machine_name])

                var options = {
                    "host": ip,
                    "port": 3100,
                    "path": "/v3/network/tcconfig",
                    "method": "PUT",
                    "headers": {
                        "Content-Type": "application/json",
                    }
                }

                http.request(options, (res) => {
                    phase.logger.info(`Sent tcconfig to ${ip}, status code is ${res.statusCode}`)
                    replyCount++
                    if (replyCount === Object.keys(phase.tcconfigs).length) {
                        phase.logger.info("Updated tcconfig on all agents")
                        resolve()
                    }
                }).end(tcconfig);
            }
        })
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

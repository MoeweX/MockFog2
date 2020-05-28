const fs = require("fs")
const fsp = fs.promises

const infrastructure = require("../../data/infrastructure.js")
const machineMeta = require("../../data/machine-meta.js")
const multiFileFunctions = require("../../data/multi-file.js")

const common = require("../common.js")
const Phase = require("../phase.js")

const conf = require("../../config.js")

class Child extends Phase {

    constructor(phaseName) {
        super(phaseName)

        this.varPath = conf.runPlaybookVarDir + "0101_bootstrap.yml"
        this.playbookPath = conf.playbookDir + "0101_bootstrap.yml"
        this.playbookLogPath = conf.runLogDir + "0101_bootstrap-playlog.log"
        this.hostsPath = conf.runDir + "hosts"
    }

    async parseInput() {
        this.infra = infrastructure()
    }

    async runPrePlaybookTasks() {
        // write var file
        await fsp.writeFile(this.varPath, this.infra.awsYML + this.infra.machinesYML)
        this.logger.info("Bootstrap playbook vars written to " + this.varPath)

        // create playbook object
        this.playbook = new common.Playbook(this.playbookPath, this.varPath)
    }

    async runPostPlaybookTasks(actionFunction) {
        // write hosts file
        await fsp.writeFile(this.hostsPath, multiFileFunctions.getHosts(this.infra, machineMeta()))
        this.logger.info("Hosts file written to " + this.hostsPath)
    }

}

module.exports = Child

if (require.main === module) {
    (async () => {
        const child = new Child("Bootstrap")

        await child.parseInput()
        await child.runPrePlaybookTasks()
        await child.executePlaybook()
        await child.runPostPlaybookTasks()
        await child.cleanUp()
    })();
}

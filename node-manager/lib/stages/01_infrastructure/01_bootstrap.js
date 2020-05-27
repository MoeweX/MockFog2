const fs = require("fs").promises

const infrastructure = require("../../data/infrastructure.js")
const common = require("../common.js")
const Phase = require("../phase.js")

const conf = require("../../config.js")

class Child extends Phase {

    constructor(phaseName) {
        super(phaseName)

        this.varPath = conf.runPlaybookVarDir + "0101_bootstrap.yml"
        this.playbookPath = conf.playbookDir + "0101_bootstrap.yml"
        this.playbookLogPath = conf.runLogDir + "0101_bootstrap-playlog.log"
    }

    async parseInput() {
        this.infra = infrastructure()
    }

    async runPrePlaybookTasks() {
        // write var file
        await fs.writeFile(this.varPath, this.infra.awsYML + this.infra.machinesYML)
        this.logger.info("Bootstrap playbook vars written to " + this.varPath)

        // create playbook object
        this.playbook = new common.Playbook(this.playbookPath, this.varPath)
    }

}

module.exports = Child

if (require.main === module) {
    (async () => {
        const child = new Child("Bootstrap")

        await child.parseInput()
        await child.runPrePlaybookTasks()
        console.log(await child.executePlaybook())
        await child.runPostPlaybookTasks()
        await child.cleanUp()
    })();
}

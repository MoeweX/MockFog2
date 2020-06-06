const fs = require("fs")
const fsp = fs.promises

const infrastructure = require("../../data/infrastructure.js")

const common = require("../common.js")
const Phase = require("../phase.js")

const conf = require("../../config.js")

class Child extends Phase {

    constructor(phaseName) {
        super(phaseName)

        this.varPath = conf.runPlaybookVarDir + "0203_stop.yml"
        this.playbookPath = conf.playbookDir + "0203_stop.yml"
        this.playbookLogPath = conf.runLogDir + "0203_stop-playlog.log"
    }

    async parseInput() {
        this.infra = infrastructure()
    }

    async runPrePlaybookTasks() {
        // write var file
        await fsp.writeFile(this.varPath, this.infra.awsYML)
        this.logger.info("Stop playbook vars written to " + this.varPath)

        // create playbook object
        this.playbook = new common.Playbook(this.playbookPath, this.varPath, ["-i", `${conf.runDir}hosts`, `--key-file=${conf.runDir}${this.infra.infra.aws.ssh_key_name}.pem`])
    }

}

module.exports = Child

if (require.main === module) {
    (async () => {
        const child = new Child("Stop")

        await child.parseInput()
        await child.runPrePlaybookTasks()
        await child.executePlaybook()
        await child.runPostPlaybookTasks()
        await child.cleanUp()
    })();
}

const fs = require("fs")
const fsp = fs.promises

const infrastructure = require("../../data/infrastructure.js")
const container = require("../../data/container.js")

const common = require("../common.js")
const Phase = require("../phase.js")

const conf = require("../../config.js")

class Child extends Phase {

    constructor(phaseName) {
        super(phaseName)

        this.varPath = conf.runPlaybookVarDir + "0204_collect.yml"
        this.playbookPath = conf.playbookDir + "0204_collect.yml"
    }

    async parseInput() {
        this.infra = infrastructure()
        this.container = container()
    }

    async runPrePlaybookTasks() {
        // get path to var file of each container
        let containerVarPaths = []
        for (const c of this.container.containers) {
            containerVarPaths.push(conf.runContainerVarDir + c["container_name"] + ".yml")
        }

        // write general var file
        await fsp.writeFile(this.varPath, this.infra.awsYML)
        this.logger.info("Collect playbook vars written to " + this.varPath)

        // create playbook object for each container
        this.playbooks = this.preparePlaybooks(containerVarPaths)
    }

    async executePlaybook() {
        const promises = []
        // we need to run multiple playbooks, not just one
        for (const i in this.playbooks) {
            const pb = this.playbooks[i]
            const container_name = this.container.containers[i]["container_name"]
            const thisObject = {
                playbookPath: this.playbookPath,
                varPath: this.varPath,
                playbookLogPath: conf.runLogDir + `0204_collect-playlog-${container_name}.log`,
                runPlaybookVarDir: this.varPath,
                phaseName: this.phaseName + "-" + container_name,
                logger: this.logger,
                playbook: pb
            }

            promises.push(super.executePlaybook.apply(thisObject))
        }

        await Promise.all(promises);
        this.logger.info("All playbooks have been executed")
    }

    preparePlaybooks(containerVarPaths) {
        let playbooks = []
        for (const containerVarPath of containerVarPaths) {
            const split = containerVarPath.split("/")
            const limit = split[split.length - 1].replace(".yml", "")
            playbooks.push(new common.Playbook(this.playbookPath, this.varPath, ["-i", `${conf.runDir}hosts`, `--key-file=${conf.runDir}${this.infra.infra.aws.ssh_key_name}.pem`, `--extra-vars=@${containerVarPath}`, `--limit=${limit}`]))
        }
        return playbooks
    }

}

module.exports = Child

if (require.main === module) {
    (async () => {
        const child = new Child("Collect")

        await child.parseInput()
        await child.runPrePlaybookTasks()
        await child.executePlaybook()
        await child.runPostPlaybookTasks()
        await child.cleanUp()
    })();
}

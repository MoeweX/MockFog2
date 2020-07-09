const fs = require("fs")
const fsp = fs.promises

const infrastructureF = require("../../data/infrastructure.js")
const containerF = require("../../data/container.js")
const deploymentF = require("../../data/deployment.js")
const machineMetaF = require("../../data/machine-meta.js")

const manipulationService = require("../../services/manipulationService.js")
const naService = require("../../services/nodeAgentService.js")

const common = require("../common.js")
const Phase = require("../phase.js")

const conf = require("../../config.js")

class Child extends Phase {

    constructor(phaseName) {
        super(phaseName)

        this.varPath = conf.runPlaybookVarDir + "0202_start.yml"
        this.playbookPath = conf.playbookDir + "0202_start.yml"
    }

    async parseInput() {
        this.infrastructureO = infrastructureF()
        this.containerO = containerF()
        this.deploymentO = deploymentF()
        this.machineMetaO = machineMetaF()
        manipulationService.fetch()
    }

    async runPrePlaybookTasks() {
        // get path to var file of each container
        let containerVarPaths = []
        for (const c of this.containerO.containers) {
            containerVarPaths.push(conf.runContainerVarDir + c["container_name"] + ".yml")
        }

        // write general var file
        await fsp.writeFile(this.varPath, this.infrastructureO.awsYML)
        this.logger.info("Start playbook vars written to " + this.varPath)

        // create playbook object for each container
        this.playbooks = this.preparePlaybooks(containerVarPaths)
    }

    async executePlaybook() {
        const promises = []

        // we need to run multiple playbooks, not just one
        for (const i in this.playbooks) {
            const pb = this.playbooks[i]
            const container_name = this.containerO.containers[i]["container_name"]
            const thisObject = {
                playbookPath: this.playbookPath,
                varPath: this.varPath,
                playbookLogPath: conf.runLogDir + `0202_start-playlog-${container_name}.log`,
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

    async runPostPlaybookTasks() {
        await manipulationService.awaitMachineResources()
        const mcrLists = manipulationService.getMCRLists(this.infrastructureO, this.deploymentO)

        // write mcrConfig file for each machine
        for (const [machine_name, mcrList] of Object.entries(mcrLists)) {
            const folder = conf.runMachinesDir + machine_name
            conf.checkFolderExists(folder)
            const filePath = folder + "/mcrConfig.json"

            await fsp.writeFile(filePath, JSON.stringify(mcrList, null, "\t"))
            this.logger.info("Wrote mcrList for " + machine_name + " to " + filePath)
        }

        // distribute mcrLists
        await naService.distributeMCRLists(this.machineMetaO, mcrLists)
    }

    preparePlaybooks(containerVarPaths) {
        let playbooks = []
        for (const containerVarPath of containerVarPaths) {
            const split = containerVarPath.split("/")
            const limit = split[split.length - 1].replace(".yml", "")
            playbooks.push(new common.Playbook(this.playbookPath, this.varPath, ["-i", `${conf.runDir}hosts`, `--key-file=${conf.runDir}${this.infrastructureO.infra.aws.ssh_key_name}.pem`, `--extra-vars=@${containerVarPath}`, `--limit=${limit}`]))
        }
        return playbooks
    }

}

module.exports = Child

if (require.main === module) {
    (async () => {
        const child = new Child("Start")

        await child.parseInput()
        await child.runPrePlaybookTasks()
        await child.executePlaybook()
        await child.runPostPlaybookTasks()
        await child.cleanUp()
    })();
}

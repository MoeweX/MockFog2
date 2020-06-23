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

        this.varPath = conf.runPlaybookVarDir + "0201_prepare.yml"
        this.playbookPath = conf.playbookDir + "0201_prepare.yml"
    }

    async parseInput() {
        this.infra = infrastructure()
        this.container = container()
    }

    async runPrePlaybookTasks() {
        // create local directory of each container
        createLocalDirs(this.container)

        // create env file for each container
        await createEnvFiles(this.container, this.logger)

        // write var file for each container
        const containerVarPaths = await createContainerVarFiles(this.container, this.logger)

        // write general var file
        await fsp.writeFile(this.varPath, this.infra.awsYML)
        this.logger.info("General Prepare playbook vars written to " + this.varPath)

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
                playbookLogPath: conf.runLogDir + `0201_prepare-playlog-${container_name}.log`,
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

function createLocalDirs(container) {
    for (const c of container.containers) {
        const dir = conf.runDir + c["local_dirname"]
        conf.checkFolderExists(dir)
    }
}

async function createEnvFiles(container, logger) {
    for (const c of container.containers) {
        const envFileString = container.getEnvFileString(c["container_name"])
        const filepath = conf.runDir + c["local_dirname"] + "/env_file.env"
        await fsp.writeFile(filepath, envFileString)
        logger.info("Created environment file for container " + c["container_name"] + " written to " + filepath)
    }
}

async function createContainerVarFiles(container, logger) {
    let varPaths = []
    for (const c of container.containers) {
        const varYmlString = container.getContainerVarYml(c["container_name"])
        const filepath = conf.runContainerVarDir + c["container_name"] + ".yml"
        await fsp.writeFile(filepath, varYmlString)
        logger.info("Prepare playbook vars for container " + c["container_name"] + " written to " + filepath)
        varPaths.push(filepath)
    }
    return varPaths
}

module.exports = Child

if (require.main === module) {
    (async () => {
        const child = new Child("Prepare")

        await child.parseInput()
        await child.runPrePlaybookTasks()
        await child.executePlaybook()
        await child.runPostPlaybookTasks()
        await child.cleanUp()
    })();
}

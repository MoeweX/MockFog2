const fs = require("fs")

const conf = require("../config.js")
const infrastructure = require("../data/infrastructure.js")
const machine_meta = require("../data/machine-meta.js")
const mff = require("../data/multi-file.js")
const common = require("./common.js")

const logger = require("../services/logService.js")("agent")

const varPath = conf.runPlaybookVarDir + "04_agent.yml"
const playbookPath = conf.playbookDir + "04_agent.yml"

rewriteFiles()

function rewriteFiles() {
    const infra = infrastructure()
    const machineMeta = machine_meta()

    // prepare var file TODO do I need a var file?
    fs.writeFileSync(varPath, infra.awsYML)
    logger.info("Agent playbook vars written to " + varPath)

    // write tcconfig file for each machine
    const tcconfigs = mff.getTCConfigs(infra, machineMeta)
    for (machine_name in tcconfigs) {
        const tcconfig = JSON.stringify(tcconfigs[machine_name], null, "\t")
        const tcconfigFolder = conf.runMachinesDir + machine_name
        conf.checkFolderExists(tcconfigFolder)
        const tcconfigPath = tcconfigFolder + "/tcconfig.json"

        fs.writeFileSync(tcconfigPath, tcconfig)
        logger.info("Wrote tcconfig for " + machine_name + " to " + tcconfigPath)
    }

    // check all dependencies
    common.checkFiles(playbookPath, varPath)
        .then(exists => { if (!exists) throw "Mandatory files for agent playbook do not exist." })
}

// requiring this file again gives you the same playbook instance
module.exports = {
    rewriteFiles: rewriteFiles,
    playbook: new common.Playbook(playbookPath, varPath, ["-i", `${conf.runDir}hosts`, `--key-file=${conf.runDir}${infrastructure().infra.aws.ssh_key_name}.pem`])
}
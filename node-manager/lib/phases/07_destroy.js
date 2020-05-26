const fs = require("fs")

const conf = require("../config.js")
const infrastructure = require("../data/infrastructure.js")
const common = require("./common.js")

const logger = require("../services/logService.js")("destroy")

const varPath = conf.runPlaybookVarDir + "07_destroy.yml"
const playbookPath = conf.playbookDir + "07_destroy.yml"

rewriteFiles()

function rewriteFiles() {
    const infra = infrastructure()

    // prepare var file
    fs.writeFileSync(varPath, infra.awsYML)
    logger.info("Destroy playbook vars written to " + varPath)

    // check all dependencies
    common.checkFiles(playbookPath, varPath)
        .then(exists => { if (!exists) throw "Mandatory files for bootstrapping playbook do not exist." })
}

// requiring this file again gives you the same playbook instance
module.exports = {
    rewriteFiles: rewriteFiles,
    playbook: new common.Playbook(playbookPath, varPath)
}
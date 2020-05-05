const fs = require("fs")

const conf = require("../config.js")
const infrastructure = require("../data/infrastructure.js")
const common = require("./common.js")

const varPath = conf.runPlaybookVarDir + "02_bootstrap.yml"
const playbookPath = conf.playbookDir + "02_bootstrap.yml"

rewriteFiles()

function rewriteFiles() {
    const infra = infrastructure()

    // prepare var file
    fs.writeFileSync(varPath, infra.awsYML + infra.machinesYML)
    console.log("Bootstrap playbook vars written to " + varPath)

    // check all dependencies
    common.checkFiles(playbookPath, varPath)
        .then(exists => { if (!exists) throw "Mandatory files for bootstrapping playbook do not exist." })
}

// requiring this file again gives you the same playbook instance
module.exports = {
    rewriteFiles: rewriteFiles,
    playbook: new common.Playbook(playbookPath, varPath)
}
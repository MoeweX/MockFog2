const fs = require("fs")

const conf = require("../config.js")
const infra = require("../data/infrastructure")
const common = require("./common.js")

// prepare var file
const varPath = conf.playbookVarDir + "02_bootstrap.yml"
fs.writeFileSync(varPath, infra.awsYML + infra.machinesYML)
console.log("Bootstrap playbook vars written to " + varPath)

// check all dependencies
const playbookPath = conf.playbookDir + "02_bootstrap.yml"
common.checkFiles(playbookPath, varPath)
    .then(exists => { if (!exists) throw "Mandatory files for bootstrapping playbook do not exist." })

// requiring this file again gives you the same playbook instance
module.exports = new common.Playbook(playbookPath, varPath)
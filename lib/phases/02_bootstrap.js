const fs = require("fs")

const conf = require("../config.js")
const infra = require("../data/infrastructure.js")
const common = require("./common.js")

// prepare var file
path = conf.playbookVarDir + "02_bootstrap.yml"
fs.writeFileSync(path, infra.ymlString)
console.log("Bootstrap playbook vars written to " + path)

// check all dependencies
const playbookPath = conf.playbookDir + "02_bootstrap.yml"
const varPath = conf.playbookVarDir + "02_bootstrap.yml"
common.checkFiles(playbookPath, varPath)
    .then(exists => { if (!exists) throw "Mandatory files for bootstrapping playbook do not exist." })

module.exports = new common.Playbook(playbookPath, varPath)
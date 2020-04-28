const fs = require("fs")

const conf = require("../config.js")
const infra = require("../data/infrastructure")
const common = require("./common.js")

// prepare var file
const varPath = conf.runPlaybookVarDir + "04_agent.yml"
fs.writeFileSync(varPath, infra.awsYML)
console.log("Agent playbook vars written to " + varPath)

// write tc config
const tcConfigPath = conf.runDir + "tcconfigs.json"
fs.writeFileSync(tcConfigPath, infra.tcConfigsJson)
console.log("TCConfigs file written to " + tcConfigPath)

// start playbook that installs tcconfig python package and node wrapper on target machine (pip and npm), and starts the node wrapper server; then it sends the initial tcconfig to this server








// // check all dependencies
// const playbookPath = conf.playbookDir + "02_bootstrap.yml"
// common.checkFiles(playbookPath, varPath)
//     .then(exists => { if (!exists) throw "Mandatory files for bootstrapping playbook do not exist." })

// // requiring this file again gives you the same playbook instance
// module.exports = new common.Playbook(playbookPath, varPath)
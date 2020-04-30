const fs = require("fs")

const conf = require("../config.js")
const infrastructure = require("../data/infrastructure.js")
const machine_meta = require("../data/machine-meta.js")
const mff = require("../data/multi-file.js")
const common = require("./common.js")

const varPath = conf.runPlaybookVarDir + "04_agent.yml"
const playbookPath = conf.playbookDir + "04_agent.yml"

rewriteFiles()

function rewriteFiles() {
    const infra = infrastructure()
    const machineMeta = machine_meta()

    // prepare var file
    fs.writeFileSync(varPath, infra.awsYML)
    console.log("Agent playbook vars written to " + varPath)

    // write tcconfig file for each machine
    const tcconfigs = mff.getTCConfigs(infra, machineMeta)
    for (machine_name in tcconfigs) {
        const tcconfig = JSON.stringify(tcconfigs[machine_name], null, "\t")
        const tcconfigFolder = conf.runMachinesDir + machine_name
        conf.checkFolderExists(tcconfigFolder)
        const tcconfigPath = tcconfigFolder + "/tcconfig.json"

        fs.writeFileSync(tcconfigPath, tcconfig)
        console.log("Wrote tcconfig for " + machine_name + " to " + tcconfigPath)
    }

    // check all dependencies
    common.checkFiles(playbookPath, varPath)
        .then(exists => { if (!exists) throw "Mandatory files for agent playbook do not exist." })
}

// start playbook that installs tcconfig python package and node wrapper on target machine (pip and npm), and starts the node wrapper server; then it sends the initial tcconfig to this server
// TODO

// requiring this file again gives you the same playbook instance
module.exports = {
    rewriteFiles: rewriteFiles,
    playbook: new common.Playbook(playbookPath, varPath)
}






// // check all dependencies
// const playbookPath = conf.playbookDir + "02_bootstrap.yml"
// common.checkFiles(playbookPath, varPath)
//     .then(exists => { if (!exists) throw "Mandatory files for bootstrapping playbook do not exist." })

// // requiring this file again gives you the same playbook instance
// module.exports = new common.Playbook(playbookPath, varPath)
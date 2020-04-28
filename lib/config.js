const path = require("path")

const runDir = path.normalize(__dirname + "/../run/")
const runConfigDir = path.normalize(runDir + "config/")
const runLogDir = path.normalize(runDir + "logs/")
const runPlaybookVarDir = path.normalize(runDir + "vars/")
const playbookDir = path.normalize(__dirname + "/../playbooks/")

// TODO: if runConfigDir not complete, copy files from example

module.exports = {
    runDir: runDir,
    runConfigDir: runConfigDir,
    runLogDir: runLogDir,
    playbookDir: playbookDir,
    runPlaybookVarDir: runPlaybookVarDir
}
const path = require("path")

const runDir = path.normalize(__dirname + "/../run/")
const runConfigDir = path.normalize(runDir + "config/")
const runLogDir = path.normalize(runDir + "logs/")
const playbookDir = path.normalize(__dirname + "/../playbooks/")
const playbookVarDir = path.normalize(runDir + "vars/")

module.exports = {
    runDir: runDir,
    runConfigDir: runConfigDir,
    runLogDir: runLogDir,
    playbookDir: playbookDir,
    playbookVarDir: playbookVarDir
}
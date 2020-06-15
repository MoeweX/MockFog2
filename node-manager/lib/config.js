const path = require("path")
const fs = require("fs")

function checkFolderExists(dirName) {
    if (!fs.existsSync(dirName)){
        fs.mkdirSync(dirName, {"recursive": true})
    }
}

const runDir = path.normalize(__dirname + "/../run/")
const runExampleDir = path.normalize(__dirname + "/../run-example/")
const runConfigDir = path.normalize(runDir + "config/")
const runExampleConfigDir = path.normalize(runExampleDir + "config/")
const runLogDir = path.normalize(runDir + "logs/")
const runMachinesDir = path.normalize(runDir + "machines/")
const runPlaybookVarDir = path.normalize(runDir + "vars/")
const runContainerVarDir = path.normalize(runPlaybookVarDir + "container/")
const playbookDir = path.normalize(__dirname + "/../playbooks/")

// Create folders if they do not exist yet
checkFolderExists(runDir)
checkFolderExists(runConfigDir)
checkFolderExists(runLogDir)
checkFolderExists(runMachinesDir)
checkFolderExists(runPlaybookVarDir)
checkFolderExists(runContainerVarDir)

//runConfigDir misses files -> copy from run-example
if (!fs.existsSync(runConfigDir + "/infrastructure.jsonc")) {
    fs.copyFileSync(runExampleConfigDir + "/infrastructure.jsonc", runConfigDir + "/infrastructure.jsonc");
}
if (!fs.existsSync(runConfigDir + "/container.jsonc")) {
    fs.copyFileSync(runExampleConfigDir + "/container.jsonc", runConfigDir + "/container.jsonc");
}
if (!fs.existsSync(runConfigDir + "/deployment.jsonc")) {
    fs.copyFileSync(runExampleConfigDir + "/deployment.jsonc", runConfigDir + "/deployment.jsonc");
}
if (!fs.existsSync(runConfigDir + "/orchestration.jsonc")) {
    fs.copyFileSync(runExampleConfigDir + "/orchestration.jsonc", runConfigDir + "/orchestration.jsonc");
}

module.exports = {
    runDir: runDir,
    runConfigDir: runConfigDir,
    runLogDir: runLogDir,
    runMachinesDir: runMachinesDir,
    playbookDir: playbookDir,
    runPlaybookVarDir: runPlaybookVarDir,
    runContainerVarDir: runContainerVarDir,
    checkFolderExists: checkFolderExists
}
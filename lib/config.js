const path = require("path")
const fs = require("fs")

function checkFolderExists(dirName) {
    if (!fs.existsSync(dirName)){
        fs.mkdirSync(dirName)
    }
}

const runDir = path.normalize(__dirname + "/../run/")
const runConfigDir = path.normalize(runDir + "config/")
const runLogDir = path.normalize(runDir + "logs/")
const runPlaybookVarDir = path.normalize(runDir + "vars/")
const playbookDir = path.normalize(__dirname + "/../playbooks/")


// Create folders if they do not exist yet
checkFolderExists(runDir)
checkFolderExists(runConfigDir)
checkFolderExists(runLogDir)
checkFolderExists(runPlaybookVarDir)

// TODO: if runConfigDir not complete, copy files from example

module.exports = {
    runDir: runDir,
    runConfigDir: runConfigDir,
    runLogDir: runLogDir,
    playbookDir: playbookDir,
    runPlaybookVarDir: runPlaybookVarDir
}
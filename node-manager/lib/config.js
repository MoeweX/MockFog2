const path = require("path")
const fs = require("fs")
const exec = require('child_process').exec

function checkFolderExists(dirName) {
    if (!fs.existsSync(dirName)){
        fs.mkdirSync(dirName, {"recursive": true})
    }
}

function setNMAddress(obj, nmPort) {
    // if we are in a gitpod environment, use gp url <port>
    exec(`gp url ${nmPort}`, (error, stdout, _) => {
        if (error) {
            // TODO if we are not in a gitpod environment, use ifconfig to get url and append port
            obj.nmAddress = `TODOAsNotInGitpod:${nmPort}`
        } else {
            obj.nmAddress = stdout.replace("\n", "")
        }
    })
}

const apiVersion = "v3"

const nmPort = 3512
const nmAddressObj = {nmAddress: "notSetYet"}
setNMAddress(nmAddressObj, nmPort) // we need to pass in an object, as it is passed by reference

async function awaitNMAddress() {
    while (nmAddressObj.nmAddress === "notSetYet") {
        await function sleep(ms) {
            return new Promise((resolve) => {
                setTimeout(resolve, ms);
            })
        }(10)  
    }
}

const runDir = path.normalize(__dirname + "/../run/")
const runExampleDir = path.normalize(__dirname + "/../run-example-crexplorer/")
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
    apiVersion: apiVersion,
    nmPort: nmPort,
    getNMaddress: function() { return nmAddressObj.nmAddress },
    awaitNMAddress: awaitNMAddress,
    runDir: runDir,
    runConfigDir: runConfigDir,
    runLogDir: runLogDir,
    runMachinesDir: runMachinesDir,
    playbookDir: playbookDir,
    runPlaybookVarDir: runPlaybookVarDir,
    runContainerVarDir: runContainerVarDir,
    checkFolderExists: checkFolderExists
}
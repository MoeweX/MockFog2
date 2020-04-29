const fs = require("fs").promises;
const spawn = require('await-spawn')

let currentConfigJson = "{}"
let _process

async function updateTCConfig(newConfig) {
    // only update if update process is not running
    if (_process) {
        return false
    }

    json = JSON.stringify(newConfig)

    await fs.writeFile("tcconfig.json", json, "utf8")
    currentConfigJson = json

    // start run tcconfig update process
    try {
        _process = spawn("tcset", ["tcconfig.json", "--import-setting"])
        await _process
    } catch(error) {
        console.log(error)
        return false
    }

    return true
}

function getTCConfigJson() {
    return currentConfigJson
}

module.exports = {
    tcconfig: getTCConfigJson,
    updateTCConfig: updateTCConfig
}
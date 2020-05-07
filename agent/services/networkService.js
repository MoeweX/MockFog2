const fs = require("fs").promises;
const spawn = require('await-spawn')

let currentConfigJson = "{}"
let _process

/**
 * 
 * Updates the current tcconfig of the agent.
 * Returns true if succesfully updated, false if an update is already in progress, and error in case of errors.
 * 
 * @param {string} newConfig - a valid tcconfig in JSON format
 */
async function updateTCConfig(newConfig) {
    // only update if update process is not running
    if (_process) {
        return false
    }

    json = JSON.stringify(newConfig)

    await fs.writeFile("tmptcconfig.json", json, "utf8")

    // start run tcconfig update process
    try {
        _process = spawn("tcset", ["tmptcconfig.json", "--import-setting"])
        await _process
    } catch(error) {
        return error
    }

    // only update currentConfigJson when no errors during update process
    currentConfigJson = json

    return true
}

function getTCConfigJson() {
    return currentConfigJson
}

module.exports = {
    tcconfig: getTCConfigJson,
    updateTCConfig: updateTCConfig
}
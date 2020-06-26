const fs = require("fs").promises;
const spawn = require('await-spawn')
const logger = require("./logService.js")("networkService")

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
        _process = spawn("tcset", ["tmptcconfig.json", "--import-setting", "--overwrite"])
        await _process
        logger.debug("TCSet completed without errors")
    } catch(error) {
        if (error.stderr && error.stderr.toString().includes("no qdisc to delete for the incoming device")) {
            logger.debug("TCSet completed with expected error " + error.stderr.toString())
        } else {
            _process = undefined
            logger.error(error)
            return error
        }
    }

    // only update currentConfigJson when no errors during update process
    currentConfigJson = json

    _process = undefined
    return true
}

function getTCConfigJson() {
    return currentConfigJson
}

/**
 * Extracts all hosts to which an outgoing filter is applied.
 * 
 * @param {string} json - the tcconfig json from which the information is extracted
 */
function getOtherHostIPs(json) {
    const config = JSON.parse(json)
    ips = []

    try {
        for (host in config["eth1"]["outgoing"]) {
            ips.push(host.toString().replace("dst-network=", "").split("/")[0])
        }
    } catch(error) {
        console.log("Unable to parse host ips" + error)
    }

    logger.verbose("The communication to the following hosts is currently shaped " + ips)
        
    return ips
}

module.exports = {
    tcconfig: getTCConfigJson,
    otherHostIps: function() { return getOtherHostIPs(currentConfigJson) },
    updateTCConfig: updateTCConfig
}
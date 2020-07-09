const { dockerCommand } = require('docker-cli-js')

const logger = require("./logService.js")("Docker Service")

// default options
const options = {
    machineName: null, // uses local docker
    currentWorkingDirectory: null, // uses current working directory
    echo: true, // echo command output to stdout/stderr
}

let currentMCRList = []

/**
 * Updates and applies resource limits according to the given mcrList, could look like this.
 * 
 * [
 *    {
 *        "container_name": "container1",
 *        "cpu": 1.2,
 *        "memory": "400m"
 *    },
 *    {
 *        "container_name": "container2",
 *        "cpu": 2.0,
 *        "memory": "200m"
 *    }
 * ]
 * 
 * @param {Array} newList - list of mcrConfigs (see above)
 */
async function updateMCRConfigs(newList) {
    let promises = []
    for (mcrConfig of newList) {
        promises.push(dockerCommand(`update --memory ${mcrConfig.memory} --memory-swap ${mcrConfig.memory} --cpus ${mcrConfig.cpu} ${mcrConfig.container_name}`))
    }

    try {
        logger.verbose(JSON.stringify(await Promise.all(promises)))
        logger.verbose("Updated all mcrconfigs")
        currentMCRList = newList
    } catch (error) {
        logger.error("Could not update machine container resource configurations")
        throw error
    }
}

/**
 * Returns a JSON string that comprises CPU and memory container stats.
 * @return {String} container stat json
 */
async function getContainerStats() {
    try {
        const data = await dockerCommand("stats --no-stream --format '{\"container_name\":\"{{ .Name }}\",\"memory\":{\"raw\":\"{{ .MemUsage }}\",\"percent\":\"{{ .MemPerc }}\"},\"cpu\":\"{{ .CPUPerc }}\"}'", options);
        
        const raw = data.raw
        logger.verbose(raw)
        const json = `[ ${raw.replace("\n", ",").slice(0, -1)} ]`

        return json
    } catch(error) {
        logger.error("Could not get container stats: " + error)
        throw error
    }
}

function getMRCListJson() {
    return JSON.stringify(currentMCRList)
}

module.exports = {
    getMRCListJson: getMRCListJson,
    updateMCRConfigs: updateMCRConfigs,
    getContainerStats: getContainerStats
}

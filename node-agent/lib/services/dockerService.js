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
        logger.verbose(await Promise.all(promises))
        currentMCRList = newList
    } catch (error) {
        logger.error("Could not update machine container resource configurations")
    }
}

/**
 * Returns a JSON object that comprises CPU and memory container stats.
 */
async function getContainerStats() {
    try {
        const data = await dockerCommand('stats --no-stream --format "{\"container\":\"{{ .Container }}\",\"memory\":{\"raw\":\"{{ .MemUsage }}\",\"percent\":\"{{ .MemPerc }}\"},\"cpu\":\"{{ .CPUPerc }}\"}"', options);
        return JSON.parse(data)
    } catch(error) {
        logger.error("Could not get container stats: " + JSON.stringify(error))
        throw error
    }
}

module.exports = {
    mcrListJson: JSON.stringify(currentMCRList),
    updateMCRConfigs: updateMCRConfigs,
    getContainerStats: getContainerStats
}

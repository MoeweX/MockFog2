const fs = require("fs");
const stripJson = require("strip-json-comments");

const conf = require("../config.js")

const logger = require("../services/logService.js")("deployment")

/**
 * Returns an array that comprises all machine_names for the given container_name in the given deployments object.
 * 
 * @param {Object} deployments the deployments json object
 * @param {String} container_name - the container name
 */
function getMachineNames(deployments, container_name) {
    for (depl of deployments) {
        if (depl["container_name"] === container_name) {
            return depl["machine_names"]
        }
    }
    logger.warn(`${deployments} does not contain information on container ${container_name}`)
    return []
}

/**
 * Returns an array that comprises all container_names for the given machine_name in the given deployments object, and the amount of resources
 * this container should get from max_resources.
 * 
 * @param {Object} deployments the deployments json object
 * @param {String} container_name - the container name
 * @return {Array} of objects: { container_name: xx, machine_resource_percentage: xx }
 */
function getContainerAndResourcePairs(deployments, machine_name) {
    let results = []

    for (const depl of deployments) {
        if (depl.machine_names.includes(machine_name)) {
            const pair = {
                container_name: depl.container_name,
                machine_resource_percentage: depl.machine_resource_percentage
            }
            results.push(pair)
        }
    }
    return results
}

module.exports = function(fileLocation) {
    if (!fileLocation) {
        fileLocation = conf.runConfigDir + "deployment.jsonc"
    }

    const deploymentJson = fs.readFileSync(fileLocation, "utf-8")
    const deployments = JSON.parse(stripJson(deploymentJson))

    return {
        deployments: deployments,
        getMachineNames: function(container_name) {
            return getMachineNames(deployments, container_name)
        },
        getContainerAndResourcePairs: function(machine_name) {
            return getContainerAndResourcePairs(deployments, machine_name)
        }
    }
}

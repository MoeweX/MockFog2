const fs = require("fs");
const stripJson = require("strip-json-comments");

const evaluateMagicFunction = require("./magic-functions.js")
const conf = require("../config.js")

const logger = require("../services/logService.js")("container")

/**
 * Returns an array that comprises all container_name in the given containers object.
 * 
 * @param {Object} containers the containers json object
 */
function getContainerNames(containers) {
    return containers.map(c => c["container_name"])
}

/**
 * Returns the container object with the given container_name. Object is empty if no such container exists.
 * 
 * @param {Object} containers the containers json object
 * @param {String} container_name name of the container
 */
function getContainerObject(containers, container_name) {
    for (c of containers) {
        if (c["container_name"] === container_name) {
            return c
        }
    }
    logger.warn(`${containers} does not contain container ${container_name}`)
    return {}
}

/**
 * Returns the environment variables of the container with the given container_name as String that can be written to a file.
 * 
 * @param {Object} containers the containers json object
 * @param {String} container_name name of the container
 */
function getEnvFileString(containers, container_name) {
    const c = getContainerObject(containers, container_name)
    result = ""
    for (const key in c["env"]) {
        const value = evaluateMagicFunction(c["env"][key]);
        result = result + `${key}=${value}\n`
    }
    return result
}

/**
 * Transforms and returns the given aws json to yml.
 * 
 * @param {Object} containers the containers json object
 * @param {String} container_name name of the container
 */
function getContainerVarYml(containers, container_name) {
    const container = getContainerObject(containers, container_name)

    return `---
container_name: ${container_name}
docker_image: ${container["docker_image"]}
container_dirname: ${container["container_dirname"]}
local_dirname: ${container["local_dirname"]}
ports: ${getPortsAsYMLList(container["ports"])}
\n`
}

function getPortsAsYMLList(ports) {
    let res = "\n"
    for (port of ports) {
        res = res + ` - "${port}"`
    }
    return res
}

module.exports = function(fileLocation) {
    if (!fileLocation) {
        fileLocation = conf.runConfigDir + "container.jsonc"
    }

    const containerJson = fs.readFileSync(fileLocation, "utf-8")
    const containers = JSON.parse(stripJson(containerJson))

    return {
        containers: containers,
        containerNames: getContainerNames(containers),
        getEnvFileString: function(container_name) {
            return getEnvFileString(containers, container_name)
        },
        getContainerVarYml: function(container_name) {
            return getContainerVarYml(containers, container_name)
        },
        getContainerObject: function(container_name) {
            return getContainerObject(containers, container_name)
        }
    }
}

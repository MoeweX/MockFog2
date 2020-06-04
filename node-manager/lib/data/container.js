const fs = require("fs");
const stripJson = require("strip-json-comments");

const conf = require("../config.js")

/**
 * Returns an array that comprises all container_name in the given containers object.
 * 
 * @param {Object} containers the containers json object
 */
function getContainerNames(containers) {
    return containers.map(c => c["container_name"])
}

module.exports = function(fileLocation) {
    if (!fileLocation) {
        fileLocation = conf.runConfigDir + "container.jsonc"
    }

    const containerJson = fs.readFileSync(fileLocation, "utf-8")
    const containers = JSON.parse(stripJson(containerJson))

    return {
        containers: containers,
        containerNames: getContainerNames(containers)
    }
}

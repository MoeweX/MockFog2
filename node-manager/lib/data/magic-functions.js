const logger = require("../services/logService.js")("magic")

const machineMeta = require("./machine-meta.js")
const deployment = require("./deployment.js")

/**
 * Checks whether the given value string is a magic function. 
 * If so, runs the function and returns the result.
 * Otherwise, just returns the given string
 * 
 * @param {Object} machineMeta the object returned by the machine-meta.js module function
 * @param valueString - the string to evaluate
 */
function evaluateMagicFunction(valueString) {
    if (! valueString.toString().startsWith("{{")) {
        return valueString
    }

    logger.debug("Running magic function " + valueString)
    const fun = valueString.replace("{{", "").replace("}}", "").replace(" ", "")
    return eval(fun)
}

function internal_ip(machine_name) {
    // get latest machine metadata
    const mm = machineMeta()

    return mm.getInternalIP(machine_name)
}

function internal_ip_container(container_name) {
    // get latest machine metadata
    const mm = machineMeta()
    const dm = deployment()

    const machineNames = dm.getMachineNames(container_name)
    let machine_name = ""
    if (machineNames.length === 0 ) {
        logger.error(`Container ${container_name} is not deployed on any container`)
    } else if (machineNames.length === 1) {
        logger.debug(`Container ${container_name} is deployed on machine ${machineNames[0]}`)
        machine_name = machineNames[0]
    } else {
        logger.warn(`Container ${container_name} is deployed on multiple machines ${machineNames}, returning the internal ip of the first one`)
        machine_name = machineNames[0]
    }

    return mm.getInternalIP(machine_name)
}

module.exports = evaluateMagicFunction
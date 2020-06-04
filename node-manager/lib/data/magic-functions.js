const logger = require("../services/logService.js")("magic")

const machineMeta = require("./machine-meta.js")

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

module.exports = evaluateMagicFunction
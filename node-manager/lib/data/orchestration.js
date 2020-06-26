const fs = require("fs");
const stripJson = require("strip-json-comments");

const conf = require("../config.js")

/**
 * @param {Object} orchestration the object returned by the orchestration.js module function
 */
function getApplicationInstructionPortsYml(orchestration) {
    let ports = new Set()
    for (state of orchestration.states) {
        for (ai of state.application_instructions) {
            ports.add(ai.port)
        }
    }
    let ymlString = "application_instruction_ports:\n"

    ports.forEach(port => {
        ymlString = ymlString + `- ${port}\n`
    });

    return ymlString + "\n"
}

module.exports = function(fileLocation) {
    if (!fileLocation) {
        fileLocation = conf.runConfigDir + "orchestration.jsonc"
    }

    const orchestrationJson = fs.readFileSync(fileLocation, "utf-8")
    const orchestration = JSON.parse(stripJson(orchestrationJson))

    return {
        orchestration: orchestration,
        states: orchestration.states,
        applicationInstructionsPortsYml: getApplicationInstructionPortsYml(orchestration)
    }
}


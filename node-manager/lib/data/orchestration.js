const fs = require("fs");
const stripJson = require("strip-json-comments");

const conf = require("../config.js")

/**
 * @param {Object} orchestration the object returned by the orchestration.js module function
 */
function applicationInstructionsAndStatesPortsYml(orchestration) {
    let ports = new Set()
    for (state of orchestration.states) {
        for (ai of state.application_instructions) {
            ports.add(ai.port)
        }
    }
    for (state of orchestration.states) {
        for (sn of state.state_notifications) {
            ports.add(sn.port)
        }
    }
    let ymlString = "application_instruction_and_states_ports:\n"

    ports.forEach(port => {
        ymlString = ymlString + `- ${port}\n`
    })

    if (ports.size == 0) {
        ymlString = ymlString + "- 9998\n" // there must be at least one port
    }

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
        applicationInstructionsAndStatesPortsYml: applicationInstructionsAndStatesPortsYml(orchestration)
    }
}


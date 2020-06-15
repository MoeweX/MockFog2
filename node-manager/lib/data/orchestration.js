const fs = require("fs");
const stripJson = require("strip-json-comments");

const conf = require("../config.js")

module.exports = function(fileLocation) {
    if (!fileLocation) {
        fileLocation = conf.runConfigDir + "orchestration.jsonc"
    }

    const orchestrationJson = fs.readFileSync(fileLocation, "utf-8")
    const orchestration = JSON.parse(stripJson(orchestrationJson))

    return {
        orchestration: orchestration,
        states: orchestration.states
    }
}


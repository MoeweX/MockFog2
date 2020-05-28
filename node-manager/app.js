const fs = require("fs")

const conf = require("./lib/config.js")
const infrastructure = require("./lib/data/infrastructure")

const Bootstrap = require("./lib/stages/01_infrastructure/01_bootstrap.js")
const Agent = require("./lib/stages/01_infrastructure/02_agent.js")
const Manipulate = require("./lib/stages/01_infrastructure/03_manipulate.js")
const Destroy = require("./lib/stages/01_infrastructure/04_destroy.js")

const logger = require("./lib/services/logService.js")("main")

const phases = {
    "bootstrap": new Bootstrap("Bootstrap"),
    "agent": new Agent("Agent"),
    "manipulate": new Manipulate("Manipulate"),
    "destroy": new Destroy("Destroy")
}

var myArgs = process.argv.slice(2);

if (myArgs[0] in phases) {
    var phase = phases[myArgs[0]]
} else {
    logger.info("Please tell me what to do...")
    process.exit(1)
}

(async () => {
    await phase.parseInput()
    await phase.runPrePlaybookTasks()
    await phase.executePlaybook()
    await phase.runPostPlaybookTasks()
    await phase.cleanUp()
})();

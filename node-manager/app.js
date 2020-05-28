const fs = require("fs")

const conf = require("./lib/config.js")
const infrastructure = require("./lib/data/infrastructure")

const Bootstrap = require("./lib/stages/01_infrastructure/01_bootstrap.js")
const Destroy = require("./lib/stages/01_infrastructure/04_destroy.js")

const logger = require("./lib/services/logService.js")("main")

const phases = {
    "bootstrap": new Bootstrap("Bootstrap"),
    "destroy": new Destroy("Destroy")
}

function doAgent() {
    logger.info("Deploying agent")
    const agent = require("./lib/phases/04_agent.js").playbook
    const agentLog = conf.runLogDir + "agent-playlog.log"
    fs.unlink(agentLog, function(err) {
        // err can be ignored, if it did not exist -> fine

        agent.on("playlog", function(data) {
            logger.verbose(data)
            fs.appendFile(agentLog, data, { "flag": "a+" }, (err) => { if (err) throw err})
        })

        agent.on("done", function(data) {
            logger.info("Agent done, exit code is: " + data)
        })

        agent.start()
    })
}

function doClean() {
    logger.info("Cleaning up")
    const clean = require("./lib/phases/08_clean.js")
    clean()
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

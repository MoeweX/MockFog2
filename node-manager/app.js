const fs = require("fs")

const app = require("express")()
const tmController = require("./lib/controller/transitionMessagesController.js")

const conf = require("./lib/config.js")
const infrastructure = require("./lib/data/infrastructure")
process.setMaxListeners(15)

// stage 1
const Bootstrap = require("./lib/stages/01_infrastructure/01_bootstrap.js")
const Agent = require("./lib/stages/01_infrastructure/02_agent.js")
const Manipulate = require("./lib/stages/01_infrastructure/03_manipulate.js")
const Destroy = require("./lib/stages/01_infrastructure/04_destroy.js")
// stage 2
const Prepare = require("./lib/stages/02_application/01_prepare.js")
const Start = require("./lib/stages/02_application/02_start.js")
const Stop = require("./lib/stages/02_application/03_stop.js")
const Collect = require("./lib/stages/02_application/04_collect.js")
// stage 3
const OrchestrationManager = require("./lib/stages/03_orchestration/orchestration-manager.js")

const logger = require("./lib/services/logService.js")("main")

const phases = {
    // stage 1
    "bootstrap": Bootstrap,
    "agent": Agent,
    "manipulate": Manipulate,
    "destroy": Destroy,
    // stage 2
    "prepare": Prepare,
    "start": Start,
    "stop": Stop,
    "collect": Collect,
    // stage 3
    "orchestrate": OrchestrationManager
}

var myArgs = process.argv.slice(2);

if (myArgs[0] in phases) {
    var Phase = phases[myArgs[0]]
} else {
    logger.info("Please tell me what to do...")
    process.exit(1)
}

(async () => {
    if (myArgs[0] === "orchestrate") {
        const server = app.listen(conf.nmPort)
        const manager = new Phase()
        tmController(app, conf.apiVersion, manager.tcEvaluator)

        new Phase().execute_schedule().then(_ => {
            logger.info("Schedlue executed")
            server.close()
        })
    } else {
        const phase = new Phase(myArgs[0]) 
        await phase.parseInput()
        await phase.runPrePlaybookTasks()
        await phase.executePlaybook()
        await phase.runPostPlaybookTasks()
        await phase.cleanUp()
    }
})();

const fs = require("fs")

const conf = require("./lib/config.js")
const infrastructure = require("./lib/data/infrastructure")

const logger = require("./lib/services/logService.js")("main")

function doBootstrap() {
    logger.info("Bootstrapping infrastructure")
    const bootstrap = require("./lib/phases/02_bootstrap.js").playbook
    const bootstrapLog = conf.runLogDir + "bootstrap-playlog.log"
    fs.unlink(bootstrapLog, function(err) {
        // err can be ignored, if it did not exist -> fine

        bootstrap.on("playlog", function(data) {
            logger.verbose(data)
            fs.appendFile(bootstrapLog, data, { "flag": "a+" }, (err) => { if (err) throw err})
        })

        bootstrap.on("done", function(data) {
            logger.info("Bootstrap done, exit code is: " + data)
        })

        bootstrap.start()
    })
}

function doHosts() {
    logger.info("Preparing hosts file")
    const writeHosts = require("./lib/phases/03_hosts.js")
    writeHosts()
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

function doDestroy() {
    logger.info("Destroying infrastructure")
    const destroy = require("./lib/phases/07_destroy.js").playbook
    const destroyLog = conf.runLogDir + "destroy-playlog.log"
    fs.unlink(destroyLog, function(err) {
        // err can be ignored, if it did not exist -> fine

        destroy.on("playlog", function(data) {
            logger.verbose(data)
            fs.appendFile(destroyLog, data, { "flag": "a+" }, (err) => { if (err) throw err})
        })

        destroy.on("done", function(data) {
            logger.info("Destroy done, exit code is: " + data)
        })

        destroy.start()
    })
}

function doClean() {
    logger.info("Cleaning up")
    const clean = require("./lib/phases/08_clean.js")
    clean()
}

var myArgs = process.argv.slice(2);

switch (myArgs[0]) {
    case "bootstrap":
        doBootstrap()
        break
    case "hosts":
        doHosts()
        break
    case "agent":
        doAgent()
        break
    case "destroy":
        doDestroy()
        break
    case "clean":
        doClean()
        break
    default:
        logger.info("Please tell me what to do...")
}

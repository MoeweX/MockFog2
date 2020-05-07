const fs = require("fs")

const conf = require("./lib/config.js")
const infrastructure = require("./lib/data/infrastructure")

function doBootstrap() {
    console.log("Bootstrapping infrastructure")
    const bootstrap = require("./lib/phases/02_bootstrap.js").playbook
    const bootstrapLog = conf.runLogDir + "bootstrap-playlog.log"
    fs.unlink(bootstrapLog, function(err) {
        // err can be ignored, if it did not exist -> fine

        bootstrap.on("playlog", function(data) {
            fs.appendFile(bootstrapLog, data, { "flag": "a+" }, (err) => { if (err) throw err})
        })

        bootstrap.on("done", function(data) {
            console.log("Bootstrap done, exit code is: " + data)
        })

        bootstrap.start()
    })
}

function doHosts() {
    console.log("Preparing hosts file")
    const writeHosts = require("./lib/phases/03_hosts.js")
    writeHosts()
}

function doAgent() {
    console.log("Deploying agent")
    const agent = require("./lib/phases/04_agent.js").playbook
    const agentLog = conf.runLogDir + "agent-playlog.log"
    fs.unlink(agentLog, function(err) {
        // err can be ignored, if it did not exist -> fine

        agent.on("playlog", function(data) {
            fs.appendFile(agentLog, data, { "flag": "a+" }, (err) => { if (err) throw err})
        })

        agent.on("done", function(data) {
            console.log("Agent done, exit code is: " + data)
        })

        agent.start()
    })
}

function doDestroy() {
    console.log("Destroying infrastructure")
    const destroy = require("./lib/phases/07_destroy.js").playbook
    const destroyLog = conf.runLogDir + "destroy-playlog.log"
    fs.unlink(destroyLog, function(err) {
        // err can be ignored, if it did not exist -> fine

        destroy.on("playlog", function(data) {
            fs.appendFile(destroyLog, data, { "flag": "a+" }, (err) => { if (err) throw err})
        })

        destroy.on("done", function(data) {
            console.log("Destroy done, exit code is: " + data)
        })

        destroy.start()
    })
}

function doClean() {
    console.log("Cleaning up")
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
        console.log("Please tell me what to do...")
}

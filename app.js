const fs = require("fs")

const conf = require("./lib/config.js")
const infrastructure = require("./lib/data/infrastructure")

function doBootstrap() {
    console.log("Bootstrapping infrastructure")
    const bootstrap = require("./lib/phases/02_bootstrap.js")
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

function doDestroy() {
    console.log("Destroying infrastructure")
    const destroy = require("./lib/phases/07_destroy.js")
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
    case "destory":
        doDestroy()
        break
    case "clean":
        doClean()
        break
    default:
        console.log("Please tell me what to do...")
}

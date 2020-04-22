const fs = require("fs")

const conf = require("./lib/config.js")
const infrastructure = require("./lib/data/infrastructure")

// so that everything is setup
require("./lib/phases/02_bootstrap.js")
require("./lib/phases/07_destroy.js")

console.log("MockFog2 is setup.")

function doBootstrap() {
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

function doDestroy() {
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

// doBootstrap()
// doDestroy()

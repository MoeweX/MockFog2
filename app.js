const fs = require("fs")

const conf = require("./lib/config.js")
const bootstrap = require("./lib/phases/02_bootstrap.js")

console.log("MockFog2 is setup.")

const bootstrapLog = conf.runLogDir + "bootstrap-playlog.log"

fs.unlink(bootstrapLog, function(err) {
    // err can be ignored, if it did not exist -> fine

    bootstrap.on("playlog", function(data) {
        fs.appendFile(bootstrapLog, data, { "flag": "a+" }, (err) => { if (err) throw err})
        bootstrap.stop()
    })

    bootstrap.on("done", function(data) {
        console.log("Bootstrapping done, exit code is: " + data)
    })

    bootstrap.start()

})

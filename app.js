const Bootstrap = require("./phases/02_bootstrap.js")
const fs = require("fs")

console.log("Hello World!")

const bootstrap = new Bootstrap()
const bootstrapLog = "./run/logs/bootstrap-playlog.log"

fs.unlink(bootstrapLog, function(err) {
    // err can be ignored, if it did not exist -> fine

    bootstrap.start()

    bootstrap.on("log", function(data) {
        console.log(data)
    })

    bootstrap.on("playlog", function(data) {
        fs.appendFile(bootstrapLog, data, { "flag": "a+" }, (err) => { if (err) throw err})
        bootstrap.stop()
    })

    bootstrap.on("done", function(data) {
        console.log("Done, exit code is: " + data)
    })
})

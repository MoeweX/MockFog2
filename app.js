let Bootstrap = require("./phases/02_bootstrap.js")

console.log("Hello World!")

const bootstrap = new Bootstrap()

bootstrap.on("log", function(data) {
    console.log(data)
})

bootstrap.on("playlog", function(data) {
    console.log("play: " + data)
})

bootstrap.on("done", function(data) {
    console.log("done, exit code is: " + data)
})

bootstrap.start()
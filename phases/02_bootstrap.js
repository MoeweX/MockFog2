var fs = require("fs");
var stripJson = require("strip-json-comments");

function bootstrap() {
    console.log("Starting bootstrapping of infrastructure")

    // read in infrastructure.json
    try {
        var path = __dirname + "/../run/config/infrastructure.json"
        var content = fs.readFileSync(path, "utf-8")
    } catch(error) {
        if (error.code === "ENOENT") {
            console.log(`No file found at ${path}`)
            return error
        }
        console.log(error)
        return error
    }

    // convert to object
    let cleanedJson = stripJson(content)
    let infra = JSON.parse(cleanedJson)
    console.log(`Infrastructure definition: ${JSON.stringify(infra)}`)

    // create var file

}

module.exports = bootstrap

bootstrap()
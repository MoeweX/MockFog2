const fs = require("fs")

const conf = require("../config.js")
const machineMeta = require("../data/machine-meta.js")()
const multiFileFunctions = require("../data/multi-file.js")

module.exports = function() {
    // write hosts file
    const hostsPath = conf.runDir + "hosts"
    fs.writeFileSync(hostsPath, multiFileFunctions.getHosts(machineMeta))
    console.log("Hosts file written to " + hostsPath)
}
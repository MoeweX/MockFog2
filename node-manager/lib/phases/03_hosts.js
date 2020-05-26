const fs = require("fs")

const conf = require("../config.js")
const infrastructure = require("../data/infrastructure.js")
const machineMeta = require("../data/machine-meta.js")
const multiFileFunctions = require("../data/multi-file.js")

const logger = require("../services/logService.js")("hosts")

module.exports = function() {
    // write hosts file
    const hostsPath = conf.runDir + "hosts"
    fs.writeFileSync(hostsPath, multiFileFunctions.getHosts(infrastructure(), machineMeta()))
    logger.info("Hosts file written to " + hostsPath)
}
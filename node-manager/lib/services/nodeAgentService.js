const http = require('http')
const conf = require("./../config.js")

const logger = require("./logService.js")("Node Agent Service")

/**
 * Sends the given tcconfigs to the public endpoint of each agent as identified by the given machine-meta object.
 * 
 * @param {Object} machineMeta the object returned by the machine-meta.js module function
 * @param {Object} tcconfigs - an object that maps machine_name to a tcconfig object
 */
async function distributeTCConfigs(machineMeta, tcconfigs) {
    var replyCount = 0

    return new Promise((resolve) => {
        for (const machine_name in tcconfigs) {
            const ip = machineMeta.getPublicIP(machine_name)
            const tcconfig = JSON.stringify(tcconfigs[machine_name])

            var options = {
                "host": ip,
                "port": 3100,
                "path": `/${conf.apiVersion}/network/tcconfig`,
                "method": "PUT",
                "headers": {
                    "Content-Type": "application/json",
                }
            }

            const req = http.request(options, (res) => {
                logger.info(`Sent tcconfig to ${ip}, status code is ${res.statusCode}`)
                replyCount++
                if (replyCount === Object.keys(tcconfigs).length) {
                    logger.info("Updated tcconfig on all agents")
                    resolve()
                }
            })

            req.on('Error', (e) => {
                logger.error(`Error while distributing tcconfigs: ${e.message}`);
            });
            
            req.end(tcconfig);
        }
    })
}

module.exports = {
    distributeTCConfigs: distributeTCConfigs
}
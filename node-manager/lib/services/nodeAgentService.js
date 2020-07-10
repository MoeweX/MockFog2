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
                logger.verbose(`Sent tcconfig to ${ip}, status code is ${res.statusCode}`)
                if (res.statusCode !== 200) {
                    logger.warn(`Tcconfig was not updated on ${ip}, status code is ${res.statusCode}`)
                }
                replyCount++
                if (replyCount === Object.keys(tcconfigs).length) {
                    logger.info("All node agents received tcconfig update")
                    resolve()
                }
            })

            req.on('error', (e) => {
                logger.error(`Error while distributing tcconfigs: ${e.message}`);
            });
            
            req.end(tcconfig);
        }
    })
}

/**
 * Sends the given mcrLists to the public endpoint of each agent as identified by the given machine-meta object.
 * 
 * @param {Object} machineMeta the object returned by the machine-meta.js module function
 * @param {Object} mcrLists - an object that maps machine_name to an mcrList array
 */
async function distributeMCRLists(machineMeta, mcrLists) {
    var replyCount = 0

    return new Promise((resolve) => {
        for (const [machine_name, mcrList] of Object.entries(mcrLists)) {
            const ip = machineMeta.getPublicIP(machine_name)

            var options = {
                "host": ip,
                "port": 3100,
                "path": `/${conf.apiVersion}/docker/mcrlist`,
                "method": "PUT",
                "headers": {
                    "Content-Type": "application/json",
                }
            }

            const req = http.request(options, (res) => {
                logger.verbose(`Sent mcrList to ${ip}, status code is ${res.statusCode}`)
                if (res.statusCode !== 200) {
                    logger.warn(`mcrList was not updated on ${ip}, status code is ${res.statusCode}`)
                }
                replyCount++
                if (replyCount === Object.keys(mcrLists).length) {
                    logger.info("Updated mcrLists on all agents")
                    resolve()
                }
            })

            req.on('error', (e) => {
                logger.error(`Error while distributing mcrLists: ${e.message}`);
            });
            
            req.end(JSON.stringify(mcrList));
        }
    })
}

module.exports = {
    distributeTCConfigs: distributeTCConfigs,
    distributeMCRLists: distributeMCRLists
}
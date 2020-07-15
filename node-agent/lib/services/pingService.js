var ping = require('ping')

const logger = require("./logService.js")("Ping Service")

let timer
// TODO add updateInterval endpoint
let interval = 20000
const ping_history = []

function startPinging(hosts) {

    if (timer) {
        logger.debug("Clearing ping timer")
        clearInterval(timer)
    }

    logger.info("Started ping to " + hosts)
    timer = setInterval(function() {
        pingHosts(hosts).then(function(res) {
            ping_history.push(res)
        })
    }, interval)

}

/**
 * 
 * Returns ping measurements to every host and unix timestamps.
 * 
 * @param {Array} hosts - an array of host ip address strings
 * @returns {object} - see above
 */
async function pingHosts(hosts) {
    results = []
    for(const host of hosts) {
        results.push(ping.promise.probe(host, {
            extra: ["-c", "10"]
        }))
    }

    const pings = []
    for (const res of await Promise.all(results)) {
        pings.push({
            "host": res.host,
            "ping": res.avg,
            "packetLoss": res.packetLoss,
            "time": Date.now()
        })
    }
    return pings
}

module.exports = {
    startPinging: startPinging,
    pingHosts: pingHosts,
    ping_history: ping_history
}
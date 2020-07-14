const bodyParser = require("body-parser")
const jsonParser = bodyParser.json()

const pingService = require("../services/pingService.js")
const config = require("../config.js")

const logger = require("../services/logService.js")("Ping Controller")

module.exports = function(app) {

    /**
     * Replies with the complete ping history as JSON
     */
    app.get(`/${config.apiVersion}/ping/all`, function(req, res) {
        res.status(200).send(JSON.stringify(pingService.ping_history))
    })

    /**
     * Replies with the last ping measurements as JSON
     */
    app.get(`/${config.apiVersion}/ping/last`, function(req, res) {
        const history = pingService.ping_history
        res.status(200).send(JSON.stringify(history[history.length - 1]))
    })

    /**
     * Based on an JSON array of given host ips, returns ping measurements to these hosts.
     */
    app.post(`/${config.apiVersion}/ping/target`, jsonParser, function(req, res) {
        const targetHosts = req.body
        logger.verbose("Pinging hosts " + targetHosts)

        if (targetHosts.length < 1) {
            res.status(400).send("No valid target hosts given, is " + targetHosts)
        }

        pingService.pingHosts(targetHosts).then(pings => res.status(200).send(JSON.stringify(pings)))
    })

}
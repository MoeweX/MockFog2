const pingService = require("../services/pingService.js")
const config = require("../config.js")

module.exports = function(app) {

    /**
     * Replies with the complete ping history as JSON
     */
    app.get(`/${config.apiVersion}/ping/all`, function(req, res) {
        res.status(200).send(JSON.stringify(pingService.ping_history))
    });

    /**
     * Replies with the last ping measurements as JSON
     */
    app.get(`/${config.apiVersion}/ping/last`, function(req, res) {
        const history = pingService.ping_history
        res.status(200).send(JSON.stringify(history[history.length - 1]))
    });

}
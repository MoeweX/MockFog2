const pingService = require("../services/pingService.js")

module.exports = function(app) {

    /**
     * Replies with the complete ping history as JSON
     */
    app.get("/v3/ping/all", function(req, res) {
        res.status(200).send(JSON.stringify(pingService.ping_history))
    });

    /**
     * Replies with the last ping measurements as JSON
     */
    app.get("/v3/ping/last", function(req, res) {
        const history = pingService.ping_history
        res.status(200).send(JSON.stringify(history[history.length - 1]))
    });

}
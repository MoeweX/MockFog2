const bodyParser = require("body-parser")
const jsonParser = bodyParser.json();
const networkService = require("../services/networkService.js")
const pingService = require("../services/pingService.js")
const logger = require("../services/logService.js")("networkController")

module.exports = function(app) {

    /**
     * Expects a tcconfig JSON as produced by the tcshow command.
     */
    app.put("/v3/network/tcconfig", jsonParser, function(req, res) {
        
        networkService.updateTCConfig(req.body)
            .then(result => {
                if (result === true) {
                    logger.info("Updated tcconfig, beginning to ping other hosts")
                    logger.verbose(req.body)
                    // restart pinging of other hosts
                    hosts = networkService.otherHostIps()
                    logger.verbose("Pinging " + hosts)
                    pingService.startPinging(5000, hosts)
                    res.sendStatus(200)
                } else if (result == false) {
                    logger.info("Update of network is already in progress")
                    res.status(500).send({"message": "Update already in progress"})
                } else {
                    if (result.errno === "ENOENT") {
                        logger.error("Update failed as tcconfig is not installed")
                        res.status(500).send({"message": "Could not update network as tcconfig is not installed", "error": result})
                    } else {
                        logger.error("Unexpected error:")
                        logger.error(error)
                        res.status(500).send({"message": "Could not update network, there was an unexpected error", "error": result.stack})
                    }
                }
            })
    });

    /**
     * Replies with a tcconfig JSON as produced by the tcshow command, or an empty object if none was set yet.
     */
    app.get("/v3/network/tcconfig", function(req, res) {
        res.status(200).send(networkService.tcconfig())
    });

}
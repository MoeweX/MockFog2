const bodyParser = require("body-parser")
const jsonParser = bodyParser.json();
const networkService = require("../services/networkService.js")
const pingService = require("../services/pingService.js")

module.exports = function(app) {

    /**
     * Expects a tcconfig JSON as produced by the tcshow command.
     */
    app.put("/v1/network/tcconfig", jsonParser, function(req, res) {
        
        networkService.updateTCConfig(req.body)
            .then(result => {
                if (result === true) {
                    console.log("Updated tcconfig")
                    // restart pinging of other hosts
                    hosts = networkService.otherHostIps()
                    console.log("Started to ping " + hosts)
                    pingService.startPinging(5000, hosts)
                    res.sendStatus(200)
                } else if (result == false) {
                    console.log("Update of network is already in progress")
                    res.status(500).send({"message": "Update already in progress"})
                } else {
                    if (result.errno === "ENOENT") {
                        console.log("Update failed as tcconfig is not installed")
                        res.status(500).send({"message": "Could not update network as tcconfig is not installed", "error": result})
                    } else {
                        console.log("Unexpected error " + result.stack)
                        res.status(500).send({"message": "Could not update network, there was an unexpected error", "error": result.stack})
                    }
                }
            })
    });

    /**
     * Replies with a tcconfig JSON as produced by the tcshow command, or an empty object if none was set yet.
     */
    app.get("/v1/network/tcconfig", function(req, res) {
        res.status(200).send(networkService.tcconfig())
    });

}
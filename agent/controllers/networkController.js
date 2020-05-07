const bodyParser = require("body-parser")
const jsonParser = bodyParser.json();
const networkService = require("../services/networkService.js")

module.exports = function(app) {

    /**
     * Expects a tcconfig JSON as produced by the tcshow command.
     */
    app.put("/v1/network/tcconfig", jsonParser, function(req, res) {
        
        console.log("Received request")

        networkService.updateTCConfig(req.body)
            .then(result => {
                if (result === true) {
                    console.log("Updated tcconfig")
                    res.sendStatus(200)
                } else if (result == false) {
                    console.log("Update of tcconfig is already in progress")
                    res.status(500).send({"message": "Update already in progress"})
                } else {
                    console.log("Unexpected error " + result)
                    res.status(500).send({"message": "Could not update tcconfig", "error": result})
                }
            })
    });

}
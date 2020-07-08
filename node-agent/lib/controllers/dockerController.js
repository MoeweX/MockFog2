const logger = require("../services/logService.js")("Docker Controller")
const dockerService = require("../services/dockerService.js")
const config = require("../config.js")

module.exports = function(app) {

    /**
     * Replies with a json of container stats, see also dockerService#getContainerStats
     */
    app.get(`/${config.apiVersion}/docker/stats`, function(req, res) {
        dockerService.getContainerStats().then(json => {
            logger.verbose("Container stats: " + json)
            res.status(200).send(json)
        }).catch(error => { 
            res.status(500).send({"message": "Could not retrieve container stats", "error": JSON.stringify(error)})
        })
    })

}
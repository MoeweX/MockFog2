const bodyParser = require("body-parser")
const jsonParser = bodyParser.json()

const logger = require("../services/logService.js")("Docker Controller")
const dockerService = require("../services/dockerService.js")
const config = require("../config.js")

module.exports = function(app) {

    /**
     * Replies with a json of container stats, see also dockerService#getContainerStats
     */
    app.get(`/${config.apiVersion}/docker/stats`, function(req, res) {
        dockerService.getContainerStats().then(json => {
            res.status(200).send(json)
        }).catch(error => { 
            res.status(500).send({"message": "Could not retrieve container stats", "error": error})
        })
    })

    /**
     * Accepts a list of mcrConfigs and uses the dockerService to update container resource limitations.
     */
    app.put(`/${config.apiVersion}/docker/mcrlist`, jsonParser, function(req, res) {
        dockerService.updateMCRConfigs(req.body)
            .then(() => {
                res.status(200).send()
            }).catch(error => {
                res.status(500).send({"message": "Could not update mcrconfigs", "error": error})
            })
    })

    /**
     * Replies with the currently applied list of mcrConfigs.
     */
    app.get(`/${config.apiVersion}/docker/mcrlist`, function(req, res) {
        res.status(200).send(dockerService.getMRCListJson())
    });

}
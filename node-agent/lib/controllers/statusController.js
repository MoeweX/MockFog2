const logger = require("../services/logService.js")("Status Controller")
const config = require("../config.js")
const si = require("systeminformation");

module.exports = function(app) {

    /**
     * Replies with an object that the total memory amount in mebibytes and the number of present cpu cores.
     */
    app.get(`/${config.apiVersion}/status/resources`, function(req, res) {
        let promises = []
        promises.push(si.mem())
        promises.push(si.cpu())
        Promise.all(promises).then(v => {
            logger.debug("Retrieved resources: " + JSON.stringify(v))
            const resources = {
                "memory": Math.floor(v[0].total / 1048576), // convert to mebibytes
                "cpu": v[1].cores
            }
            res.status(200).send(JSON.stringify(resources))
        }).catch(error => { 
            res.status(500).send({"message": "Could not retrieve machine resources", "error": JSON.stringify(error)})
        })
    })

}
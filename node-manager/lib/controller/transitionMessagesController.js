const logger = require("../services/logService.js")("Transition Messages Controller")

/**
 * @param {Object} app - express application object
 * @param {String} apiVersion - api version (without /)
 * @param {Object} tcEvaluator - TCEvaluator object
 */
function controllerFunction(app, apiVersion, tcEvaluator) {

    /**
     * Adds the given event_name to the TCEvaluator.
     * HTTP.GET as the browser can do it.
     */
    app.get(`/${apiVersion}/transition/message`, function(req, res) {
        
        const event_name = req.query.event_name
        if (!event_name) {
            logger.warn("Queryparams does not contain event_name: " + req.query)
            res.status(400).send("Queryparams must contain event_name")
            return
        }
        const success = tcEvaluator.addEvent(event_name)
        if (success) {
            res.status(200).end()
        } else {
            res.status(403).end("TCEvaluator is not active or the event_name is not part of active conditions")
        }
    })

}

module.exports = controllerFunction
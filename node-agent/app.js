const express = require("express")
var path = require('path')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger.json')

const config = require("./lib/config.js")
const logger = require("./lib/services/logService.js")("main")
const networkService = require("./lib/services/networkService.js")

const networkController = require("./lib/controllers/networkController.js")
const pingController = require("./lib/controllers/pingController.js")
const statusController = require("./lib/controllers/statusController.js")
const dockerController = require("./lib/controllers/dockerController.js")

const app = express()
const port = config.port

// intercept all requests for logging
app.use(function (req, res, next) {
    var fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
    logger.http("Request to " + fullUrl)
    next();
});

// setup viewengine
app.set("view engine", "ejs");
app.get("/test", function (req, res) {
    res.render("test", { tcconfig: networkService.tcconfig() })
})

// setup swagger
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// route / to swagger
app.get("/", function (req, res) {
    res.writeHead(302, {
        "Location": "swagger"
    });
    res.end();
})

// setup controllers
networkController(app)
pingController(app)
statusController(app)
dockerController(app)

logger.info("Node Agent started, listening on port " + port)
app.listen(port)
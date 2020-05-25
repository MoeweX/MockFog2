const express = require("express");
var path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const logger = require("./services/logService.js")("main")
const networkService = require("./services/networkService.js")

const networkController = require("./controllers/networkController.js")
const pingController = require("./controllers/pingController.js")

const app = express()
const port = process.env.AGENT_PORT || 3000

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

logger.info("Agent started, listening on port " + port)
app.listen(port)
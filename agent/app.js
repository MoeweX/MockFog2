const express = require("express");
var path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const networkService = require("./services/networkService.js")
const networkController = require("./controllers/networkController.js")

const app = express()
const port = process.env.AGENT_PORT || 3000

// setup viewengine
app.set("view engine", "ejs");
app.get("/test", function(req, res) {
    console.log("Called")
    console.log(networkService.tcconfig())
    res.render("test", { tcconfig: networkService.tcconfig() })
})

// setup swagger
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// route / to swagger
app.get("/", function(req, res) {
    res.writeHead(302, {
        "Location": "swagger"
    });
    res.end();
})

// setup controllers
networkController(app)

console.log("Agent started, listening on port " + port)
app.listen(port)
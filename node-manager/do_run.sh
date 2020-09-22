#!/bin/bash

node app.js bootstrap
node app.js agent
node app.js agent
node app.js manipulate
node app.js prepare
node app.js start
node app.js orchestrate
node app.js stop
node app.js collect
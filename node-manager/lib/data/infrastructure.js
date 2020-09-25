const fs = require("fs");
const stripJson = require("strip-json-comments");
const Graph = require('node-dijkstra')
const converter = require("../services/conversionService.js")

const conf = require("../config.js")
const logger = require("../services/logService.js")("Infrastructure")

/**
 * The defaults are used if a certain field is optional and not set
 */
const DEFAULTS = {
    // connection rate
    "rate": "1gbps",
    // connection delay distribution in ms
    "delay-distro": 0,
    // connection duplicate probablity in %
    "duplicate": 0,
    // connection loss probability in %
    "loss": 0,
    // connection corrupt probality in %
    "corrupt": 0,
    // connection reordering probability in %
    "reordering": 0
}

function avg(arr) {
    let sum = 0
    for (v of arr) {
        sum += v
    }
    return sum/arr.length
}

/**
 * Returns the connection object with the given to and from field.
 * Also checks reverse paths as connections are bidirectional.
 * 
 * @param {Object} infra the infrastructure json object
 * @param {String} to 
 * @param {String} from 
 * @return {Object} - the connection object
 */
function getConnection(infra, to, from) {
    for (const connection of infra.connections) {
        if (connection.to === to && connection.from === from) {
            return connection
        } else if (connection.to === from && connection.from === to) {
            return connection
        }
    }
    logger.error(`No connection to ${to} from ${from} exists.`)
}

//*************************************
// Playbook Var Helper
//*************************************

/**
 * Transforms and returns the given aws json to yml.
 * 
 * @param {Object} aws the infrastructure json aws object
 */
function getAWSYml(aws) {
    return `---
ec2_region: ${aws.ec2_region}
ssh_key_name: ${aws.ssh_key_name}
agent_port: ${aws.agent_port}
\n`
}

/**
 * Transforms and returns the given machines json to yml.
 * 
 * @param {Object} machines the infrastructure json machines object
 */
function getMachinesYml(machines) {
    let ymlString = "machines:"

    machines.forEach(machine => {
        ymlString = ymlString + `
- machine_name: ${machine.machine_name}
  type: ${machine.type}
  image: ${machine.image}`
    });

    return ymlString + "\n"
}

//*************************************
// Graph Helper
//*************************************

/**
 * Returns the infrastructure machines and connections in graph form.
 * 
 * @param {Object} infra the infrastructure json object
 */
function getGraph(infra) {
    const g = new Graph()

    infra.machines.forEach(machine => {
        g.addNode(machine.machine_name, getOneHopEdges(machine.machine_name, infra.connections))
    })

    return g
}

/**
 * Returns an object that comprises other machines reachable with a single hop and the delay to these machines.
 * 
 * @param {String} machine_name
 * @param {Object} connections the infrastructure json connnections object
 * @returns {Object} with machine names as key and the delay to the target machine as value
 */
function getOneHopEdges(machine_name, connections) {
    let result = {}
    connections.forEach(connection => {
        // could be encoded in either direction (bidirectional)
        if (machine_name === connection.from) {
            result[connection.to] = connection.delay == 0 ? 1e-10 : connection.delay
        } else if (machine_name === connection.to) {
            result[connection.from] = connection.delay == 0 ? 1e-10 : connection.delay
        }
    })
    return result
}

/**
 * Calculates the bandwidth/rate for the given path.
 * The result is the minimum bandwidth of any individual connections
 * 
 * @param {Object} infra the infrastructure json object
 * @param {Array} path - comprises the machine_name of nodes on the given path
 * @param {Boolean} withUnit - whether to append the unit of measurement
 * @return {*} the bandwidth/rate of the path in bps as String or Number
 */
function calculatePathRate(infra, path, withUnit) {
    let minBandwidth = Number.MAX_VALUE
    for (let i = 0; i < path.length - 1; i++) {
        const connection = getConnection(infra, path[i], path[i + 1])
        const bandwidth = converter.convertTobps(connection.rate || DEFAULTS["rate"])
        if (bandwidth < minBandwidth) {
            minBandwidth = bandwidth
        }
    }

    if (withUnit) {
        return minBandwidth + "bps"
    } else {
        return minBandwidth
    }
}

/**
 * Calculates the delay distribution for the given path in ms
 * The result is the average of all individual connections
 * 
 * @param {Object} infra the infrastructure json object
 * @param {Array} path - comprises the machine_name of nodes on the given path
 * @return {Number} the delay distribution for the given path in ms
 */
function calculatePathDelayDistro(infra, path) {
    let values = []
    for (let i = 0; i < path.length - 1; i++) {
        const connection = getConnection(infra, path[i], path[i + 1])
        const delayDistro = connection["delay-distro"] || DEFAULTS["delay-distro"]
        values.push(delayDistro)
    }
    return avg(values)
}

/**
 * Calculates the duplicate probability for the given path in %
 * The result is the average of all individual connections
 * 
 * @param {Object} infra the infrastructure json object
 * @param {Array} path - comprises the machine_name of nodes on the given path
 * @return {Number} the duplicate probablity for the given path in %
 */
function calculatePathDuplicate(infra, path) {
    let values = []
    for (let i = 0; i < path.length - 1; i++) {
        const connection = getConnection(infra, path[i], path[i + 1])
        const duplicate = connection["duplicate"] || DEFAULTS["duplicate"]
        values.push(duplicate)
    }
    return avg(values)
}

/**
 * Calculates the loss probability for the given path in %
 * The result is the average of all individual connections
 * 
 * @param {Object} infra the infrastructure json object
 * @param {Array} path - comprises the machine_name of nodes on the given path
 * @return {Number} the loss probablity for the given path in %
 */
function calculatePathLoss(infra, path) {
    let values = []
    for (let i = 0; i < path.length - 1; i++) {
        const connection = getConnection(infra, path[i], path[i + 1])
        const loss = connection["loss"] || DEFAULTS["loss"]
        values.push(loss)
    }
    return avg(values)
}

/**
 * Calculates the corrupt probability for the given path in %
 * The result is the average of all individual connections
 * 
 * @param {Object} infra the infrastructure json object
 * @param {Array} path - comprises the machine_name of nodes on the given path
 * @return {Number} the corrupt probablity for the given path in %
 */
function calculatePathCorrupt(infra, path) {
    let values = []
    for (let i = 0; i < path.length - 1; i++) {
        const connection = getConnection(infra, path[i], path[i + 1])
        const corrupt = connection["corrupt"] || DEFAULTS["corrupt"]
        values.push(corrupt)
    }
    return avg(values)
}

/**
 * Calculates the reordering probability for the given path in %
 * The result is the average of all individual connections
 * 
 * @param {Object} infra the infrastructure json object
 * @param {Array} path - comprises the machine_name of nodes on the given path
 * @return {Number} the reordering probablity for the given path in %
 */
function calculatePathReordering(infra, path) {
    let values = []
    for (let i = 0; i < path.length - 1; i++) {
        const connection = getConnection(infra, path[i], path[i + 1])
        const reordering = connection["reordering"] || DEFAULTS["reordering"]
        values.push(reordering)
    }
    return avg(values)
}

module.exports = function(fileLocation) {
    if (!fileLocation) {
        fileLocation = conf.runConfigDir + "infrastructure.jsonc"
    }

    const infraJson = fs.readFileSync(fileLocation, "utf-8")
    const stripped = stripJson(infraJson)
    try {
        var infra = JSON.parse(stripped)
    } catch (error) {
        logger.error(error)
        logger.error(stripped)
        process.exit(1)
    }

    return {
        infra: infra,
        graph: getGraph(infra),
        awsYML: getAWSYml(infra.aws),
        machinesYML: getMachinesYml(infra.machines),
        getGraph: getGraph,
        _getOneHopEdges: getOneHopEdges,
        calculatePathRate: function(path, withUnit) {
            return calculatePathRate(infra, path, withUnit)
        },
        calculatePathDelayDistro: function(path) {
            return calculatePathDelayDistro(infra, path)
        },
        calculatePathDuplicate: function(path) {
            return calculatePathDuplicate(infra, path)
        },
        calculatePathLoss: function(path) {
            return calculatePathLoss(infra, path)
        },
        calculatePathCorrupt: function(path) {
            return calculatePathCorrupt(infra, path)
        },
        calculatePathReordering: function(path) {
            return calculatePathReordering(infra, path)
        }
    }
}


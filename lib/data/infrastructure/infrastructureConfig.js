const fs = require("fs");
const stripJson = require("strip-json-comments");
const Graph = require('node-dijkstra')

const conf = require("../../config.js")

/**
 * Transforms and returns the given aws json to yml.
 * 
 * @param {Object} aws the infrastructure json aws object
 */
function getAWSYml(aws) {
    return `---
ec2_region: ${aws.ec2_region}
ssh_key_name: ${aws.ssh_key_name}\n`
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
 */
function getOneHopEdges(machine_name, connections) {
    let result = {}
    connections.forEach(connection => {
        // could be incoded in either direction (bidirectional)
        if (machine_name === connection.from) {
            result[connection.to] = connection.delay
        } else if (machine_name === connection.to) {
            result[connection.from] = connection.delay
        }
    })
    return result
}

// errors should stop program, so do not catch
const infraJson = fs.readFileSync(conf.runConfigDir + "infrastructure.json", "utf-8")
const infra = JSON.parse(stripJson(infraJson))

module.exports = {
    infra: JSON.parse(stripJson(infraJson)), // parse again so that it does not overwrite the original object
    graph: getGraph(infra),
    awsYML: getAWSYml(infra.aws),
    machinesYML: getMachinesYml(infra.machines),
}
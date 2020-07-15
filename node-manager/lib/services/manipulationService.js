/**
 * The manipulation service computes tcconfigs and mcrConfigs.
 * For that, it keeps additional connection and machine data in the machines directory.
 * Besides the additional connection and machine data, it does not have any state.
 * Thus, it computes configurations based on given inputs on the fly.
 * 
 * 
 * For tcconfigs, the manipulation service:
 *  - collects existing delays between machines on first startup from node agents
 *  - creates per-machine tcconfigs based on inputs
 *  - throws errors when machine graph is not fully connected or connections miss delay property
 * 
 * For mcrConfigs, the manipulation service:
 *  - collects max_memory and max_cpu of each machine on first startup from node agents
 *  - creates per-machine mcrLists based on inputs
 */
const fs = require('fs')
const got = require('got');

const logger = require("../services/logService.js")("Manipulation Service")
const config = require("../config.js")
const infrastructureF = require("../data/infrastructure.js")
const machineMetaF = require("../data/machine-meta.js")
const multiFile = require("../data/multi-file.js")
const conversionService = require("../services/conversionService.js")
const stripJson = require("strip-json-comments");

/**
 * Returns an array of tcconfig that can be restored by https://tcconfig.readthedocs.io/en/latest/index.html for each machine part of the defined infrastructure.
 * 
 * @param {Object} infrastructure the object returned by the infrastructure.js module function
 * @param {Object} machineMeta the object returned by the machine-meta.js module function
 */
function getTCConfigs(infrastructure, machineMeta) {
    // setup fields
    const machines = infrastructure.infra.machines
    const graph = infrastructure.graph
    const getInternalIP = machineMeta.getInternalIP // this is a function

    const tcConfig = {}

    machines.forEach(start => {
        let fillerId = 800
        const outgoing = {}
        const existingDelays = connectionDelays[start.machine_name]

        for (const target of machines) {
            if (start.machine_name === target.machine_name) continue

            const existingDelayToTarget = existingDelays.filter(obj => obj.target_host === target.machine_name)[0].ping

            const route = graph.path(start.machine_name, target.machine_name, { cost: true })
            const path = route.path

            // variable names are also the key names for tcconfig if not specified otherwise
            let delay = 0
            const includingExisting = route.cost - (existingDelayToTarget / 2)
            if (includingExisting > 0) {
                delay = includingExisting
            }
            delay = parseInt(delay * 1000) + "us"
            const rate = infrastructure.calculatePathRate(path, true)
            const delayDistro = infrastructure.calculatePathDelayDistro(path) // keyname must be delay-distro
            const duplicate = infrastructure.calculatePathDuplicate(path)
            const loss = infrastructure.calculatePathLoss(path)
            const corrupt = infrastructure.calculatePathCorrupt(path)
            const reordering = infrastructure.calculatePathReordering(path)

            outgoing[`dst-network=${getInternalIP(target.machine_name)}/32, protocol=ip`] = {
                machine_name: target.machine_name,
                filler_id: `800:${fillerId}`,
                delay: delay,
                rate: rate,
                "delay-distro": delayDistro,
                duplicate: duplicate,
                loss: loss,
                corrupt: corrupt,
                reordering: reordering
            }

            fillerId++
        }

        tcConfig[start.machine_name] = {
            "eth0": {
                "outgoing": {},
                "incoming": {}
            },
            "eth1": {
                "outgoing": outgoing,
                "incoming": {}
            }
        }
    })

    return tcConfig
}

/**
 * Returns an object that comprises a list of mcrconfigs or each machine of the given infrastructure.
 * If the infrastructure does not contain a memory/cpu limit for any machine, uses the values of machineResources field. 
 *
 * @param {Object} infrastructureO the object returned by the infrastructure.js module function
 * @param {Object} deploymentO the object returned by the deployment.js module function
 * @return {Object} maps machine_name to mcrLists
 */
function getMCRLists(infrastructureO, deploymentO) {
    let mcrLists = { }

    for (const machine of infrastructureO.infra.machines) {
        let mcrList = []

        const machine_cpu = machine.cpu || machineResources[machine.machine_name].max_cpu
        const machine_memory = conversionService.convertToMebibyte(machine.memory || machineResources[machine.machine_name].max_memory + "m")
        logger.verbose(`Machine ${machine.machine_name} has a CPU limit of ${machine_cpu} and a memory limit of ${machine_memory}m`)

        for (const pair of deploymentO.getContainerAndResourcePairs(machine.machine_name)) {
            logger.debug("Container pair: " + JSON.stringify(pair))

            const mcrConfig = {
                "container_name": pair.container_name,
                "cpu": machine_cpu * pair.machine_resource_percentage / 100.0,
                "memory": (machine_memory * pair.machine_resource_percentage / 100.0) + "m"
            }
            logger.verbose("MCRConfig is " + JSON.stringify(mcrConfig))

            mcrList.push(mcrConfig)
        }

        mcrLists[machine.machine_name] = mcrList
    }
    return mcrLists
}

/**
 * 
 * @param {Array} machineList - comprises { machine_name: xx, public_ip: xx } objects
 */
function updateMachineAndConnectionData(machineList) {

    // read in existing connectionDelay or fetch if they do not exist
    fs.readFile(config.runMachinesDir + "connection_delays.jsonc", "utf8", function (err, data) {
        if (err) {
            logger.verbose("Connection delays have not been fetched yet, doing it now")
            connectionDelays = _fetchConnectionDelays(machineList)
        } else {
            logger.verbose("Loading connection delays from file")
            connectionDelays = JSON.parse(data)
            logger.info("Connection delays are " + JSON.stringify(connectionDelays))
        }
    })

    // read in existing machineResources or fetch if they do not exist
    fs.readFile(config.runMachinesDir + "machine_container_resources.jsonc", "utf8", function (err, data) {
        if (err) {
            logger.verbose("Maximum machine resources have not been fetched yet, doing it now")
            machineResources = _fetchMachineResources(machineList)
        } else {
            logger.verbose("Loading maximum machine resources from file")
            machineResources = JSON.parse(stripJson(data))
            logger.info("Maximum machine resources are " + JSON.stringify(machineResources))
        }
    })

}

/**
 * Fetches the current connection delays from all node agent endpoints and writes results to file.
 * 
 * @param {Array} machineList - comprises { machine_name: xx, public_ip: xx } objects
 * @return {Object} that comprises connection delays: machine_name -> [ { private_ip: xx, delay: xx } ]
 */
function _fetchConnectionDelays(machineList) {
    let machineNames = []
    let promises = []
    const mmO = machineMetaF()
    const targetHosts = machineList.map(tuple => tuple.public_ip)

    for (const m of machineList) {
        promises.push(got.post(`http://${m.public_ip}:3100/${config.apiVersion}/ping/target`, { json: targetHosts }))
        machineNames.push(m.machine_name)
    }

    Promise.all(promises).then(v => {
        let result = {}

        for (i in machineNames) {
            const machine_name = machineNames[i]
            const pings = JSON.parse(v[i].body)
            
            pingArray = []

            for (ping of pings) {
                pingArray.push({
                    "target_host": mmO.getMachineNameFromPublicIp(ping.host),
                    "public_ip": ping.host,
                    "ping": parseFloat(ping.ping)
                })
            }

            result[machine_name] = pingArray
        }
        connectionDelays = result
        logger.info("Connection delays are " + JSON.stringify(connectionDelays))

        // write to file
        fs.writeFile(config.runMachinesDir + "connection_delays.jsonc", JSON.stringify(result, null, "\t"), function (err) {
            if (err) { throw err }
            logger.verbose("Connection delays written to file")
        })
    }).catch(error => {
        logger.error(`Error while retrieving connection delays: ${JSON.stringify(error)}`);
    })
}

/**
 * Fetches the maximum machine resources from all node agent endpoints and writes results to file.
 * 
 * @param {Array} machineList - comprises { machine_name: xx, public_ip: xx } objects
 * @return {Object} that comprises machine resources: machine_name -> { machine_name: xx, max_memory: xx (int, in mebibytes), max_cpu: xx (float)}; 
 */
function _fetchMachineResources(machineList) {
    let machineNames = []
    let promises = []

    for (const m of machineList) {
        promises.push(got(`http://${m.public_ip}:3100/${config.apiVersion}/status/resources`))
        machineNames.push(m.machine_name)
    }

    Promise.all(promises).then(v => {
        let result = {}

        for (i in machineNames) {
            const machine_name = machineNames[i]
            const resources = JSON.parse(v[i].body)

            result[machine_name] = {
                "machine_name": machine_name,
                "max_memory": resources["memory"],
                "max_cpu": resources["cpu"]
            }
        }
        machineResources = result
        logger.info("Maximum machine resources are " + JSON.stringify(machineResources))

        // write to file
        fs.writeFile(config.runMachinesDir + "machine_container_resources.jsonc", JSON.stringify(result, null, "\t"), function (err) {
            if (err) { throw err }
            logger.verbose("Machine resources written to file")
        })
    }).catch(error => {
        logger.error(`Error while retrieving machine resources: ${JSON.stringify(error)}`);
    })
}

// ****************************************************
// MODULE STATE
// ****************************************************

// machine_name -> { machine_name: xx, delay: xx }
let connectionDelays = {}
// machine_name -> { machine_name: xx, max_memory: xx (int, in mebibytes), max_cpu: xx (float)}
let machineResources = {}

async function awaitMachineResources() {
    while (!Object.keys(machineResources).length) {
        await function sleep(ms) {
            return new Promise((resolve) => {
                setTimeout(resolve, ms);
            })
        }(10)
    }
}

async function awaitConnectionDelays() {
    while (connectionDelays === undefined || !Object.keys(connectionDelays).length) {
        await function sleep(ms) {
            return new Promise((resolve) => {
                setTimeout(resolve, ms);
            })
        }(10)
    }
}

module.exports = {
    fetch: function () {
        updateMachineAndConnectionData(multiFile.getMachineList(infrastructureF(), machineMetaF()))
    },
    awaitMachineResources: awaitMachineResources,
    awaitConnectionDelays: awaitConnectionDelays,
    getTCConfigs: getTCConfigs,
    getMCRLists: getMCRLists
}
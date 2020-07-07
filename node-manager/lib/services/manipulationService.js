/**
 * The manipulation service computes tcconfigs and mrconfigs.
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
 * For mrconfigs, the manipulation service:
 *  - collects max_memory and max_cpu of each machine on first startup from node agents
 *  - creates per-machine mrconfigs based on inputs
 */
const fs = require('fs');

const logger = require("../services/logService.js")("Manipulation Service")
const config = require("../config.js")
const infrastructureF = require("../data/infrastructure.js")
const machineMetaF = require("../data/machine-meta.js")
const multiFile= require("../data/multi-file.js")

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

        for (const target of machines) {
            if (start.machine_name === target.machine_name) continue

            const route = graph.path(start.machine_name, target.machine_name, { cost: true })
            const path = route.path

            // variable names are also the key names for tcconfig if not specified otherwise
            const delay = route.cost // TODO consider already existing delay between machines https://github.com/MoeweX/MockFog2/issues/36
            const rate = infrastructure.calculatePathRate(path, true)
            const delayDistro = infrastructure.calculatePathDelayDistro(path) // keyname must be delay-distro
            const duplicate  = infrastructure.calculatePathDuplicate(path)
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
 * TODO
 * @param {Object} infrastructure the object returned by the infrastructure.js module function
 */
function getMCConfigs(infrastructure) {
    // TODO
}

/**
 * 
 * @param {Array} machineList - comprises { machine_name: xx, public_ip: xx } objects
 */
function updateMachineAndConnectionData(machineList) {

    // read in existing connectionDelay or fetch if they do not exist
    fs.readFile(config.runMachinesDir + "connectionDelay.json", function(err, data) {
        if (err) { 
            logger.verbose("Connection delays have not been fetched yet, doing it now")
            connectionDelays = _fetchConnectionDelays(machineList)
        } else {
            connectionDelays = JSON.parse(data)
        }
    })

    // read in existing machineResources or fetch if they do not exist
    fs.readFile(config.runMachinesDir + "machineResources.json", function(err, data) {
        if (err) { 
            logger.verbose("Machine resources have not been fetched yet, doing it now")
            machineResources = _fetchMachineResources(machineList)
        } else {
            connectionmachineResourcesDelays = JSON.parse(data)
        }
    })

}

/**
 * Fetches the current connection delays from all node agent endpoints and writes results to file.
 * 
 * @param {Array} machineList - comprises { machine_name: xx, public_ip: xx } objects
 * @return {Object} that comprises connection delays: machine_name -> { machine_name: xx, delay: xx }
 */
function _fetchConnectionDelays(machineList) {
    // TODO
    logger.warn("Fetch connection delays not yet implemented")
    // TODO write to file
}

/**
 * Fetches the maximum machine resources from all node agent endpoints and writes results to file.
 * 
 * @param {Array} machineList - comprises { machine_name: xx, public_ip: xx } objects
 * @return {Object} that comprises machine resources: machine_name -> { machine_name: xx, max_memory: xx, max_cpu: xx }
 */
function _fetchMachineResources(machineList) {
    // TODO
    logger.warn("Fetch machine resources not yet implemented")
    // TODO write to file
}

// ****************************************************
// MODULE STATE
// ****************************************************

// machine_name -> { machine_name: xx, delay: xx }
let connectionDelays = { }
// machine_name -> { machine_name: xx, max_memory: xx, max_cpu: xx }
let machineResources = { }

// initialize machine and connection data

module.exports = {
    fetch: function() {
        updateMachineAndConnectionData(multiFile.getMachineList(infrastructureF(), machineMetaF()))
    },
    getTCConfigs: getTCConfigs,
    updateMachineAndConnectionData: updateMachineAndConnectionData
}
const infrastructureConfig = require("./infrastructureConfig.js")
const machineMeta = require("./machineMeta.js")

/**
 * Returns a tcconfig that can be restored by https://tcconfig.readthedocs.io/en/latest/index.html for the
 * given machine.
 * 
 * @param {String} machine_name 
 * @param {Object} infrastructureConfig the infrastructure config object
 * @param {Object} machineMeta the machine meta object
 */
function getTCConfig(infrastructureConfig, machineMeta) {
    // setup fields
    const machines = infrastructureConfig.infra.machines
    const graph = infrastructureConfig.graph
    const getInternalIP = machineMeta.getInternalIP // this is a function

    const tcConfig = {}

    machines.forEach(start => {
        let fillerId = 800
        const outgoing = {}

        for (const target of machines) {
            if (start.machine_name === target.machine_name) continue

            const delay = graph.path(start.machine_name, target.machine_name, { cost: true }).cost

            outgoing[`dst-network=${getInternalIP(target.machine_name)}/32, protocol=ip`] = {
                filler_id: `800:${fillerId}`,
                delay: delay
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

module.exports = {
    awsYML: infrastructureConfig.awsYML,
    machinesYML: infrastructureConfig.machinesYML,
    tcConfig: getTCConfig(infrastructureConfig, machineMeta)
}

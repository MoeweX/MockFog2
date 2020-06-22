const orchestrationF = require("../../data/orchestration.js")
const deploymentF = require("../../data/deployment.js")
const infrastructureF = require("../../data/infrastructure.js")()

const multiFileFunctions = require("../../data/multi-file.js")
const naService = require("../../services/nodeAgentService.js")
const machineMeta = require("../../data/machine-meta.js")

const logger = require("../../services/logService.js")("Orchestration Manager")

class Manager {

    constructor(debug = false) {
        this.debug = debug
        this.states = orchestrationF().states
        this.infrastructure = infrastructureF()
        this.deployment = deploymentF()
        this.status = "idle"
    }

    async execute_schedule() {
        if (this.status !== "idle") {
            logger.warn("Cannot start manager is " + this.status)
            return
        }
        this.status = "executing"

        for (const state of this.states) {
            logger.info("Starting transition to state " + state.state_name)
            await this.doTransition(state)
            logger.info("Completed transition to state " + state.state_name)

            logger.info("Doing state " + state.state_name)
            await this.doState(state)
            logger.info("Completed state " + state.state_name)
        }

        this.status = "idle"
    }

    async doTransition(state) {
        // resource manipulation
        if (state.resource_manipulation_instructions === "reset") {
            logger.info("Resetting infrastructure manipulations")
            this.infrastructure = require("../../data/infrastructure.js")()
        } else {
            // apply manipulations to this.infrastructure.infra
            this.infrastructure = applyConnectionUpdates(this.infrastructure, state.resource_manipulation_instructions.connection_updates)

            // this updates the graph with the newest infra data
            this.infrastructure.graph = this.infrastructure.getGraph(this.infrastructure.infra)
        }
        if (!this.debug) {
            const mm = machineMeta()

            const tcconfigs = multiFileFunctions.getTCConfigs(this.infrastructure, mm)
            await naService.distributeTCConfigs(mm, tcconfigs)

            // application instructions
            await distributeApplicationInstructions(state.application_instructions, this.deployment, mm, this.infrastructure.infra.aws.agent_port)
        }
    }

    async doState(state) {
        return new Promise(resolve => {
            // TODO resolve transition conditions for each target state individually
            // TODO also consider message-based conditions

            // find time-based conditions
            const timeBasedConditions = state.transition_conditions.filter(tc => tc.type === "time-based")

            // if there is none -> return
            if (timeBasedConditions.length === 0) {
                logger.debug("There is no time-based transition condition, state completes immediatly")
                resolve()
            }

            // validate there is at most one
            if (timeBasedConditions.length > 1) {
                logger.error("There should only be a single time-based condition; picking the first one")
            }

            // if there is one -> wait for defined time
            const time = timeBasedConditions[0]["active-for"]
            logger.info("Time-based condition: " + time / 1000 + "s.")
            setTimeout(resolve, time)
        })
    }

}

/**
 * Replaces connection information in the given infrastructure object with same from/to as found in the given connection_updates
 * 
 * @param {Object} infrastructure the object returned by the infrastructure.js module function
 * @param {*} connection_updates the new connection_updates to use
 */
function applyConnectionUpdates(infrastructure, connection_updates) {
    const infra = infrastructure.infra

    for (const connection of connection_updates) {
        // find connection
        let toUpdate = infra.connections.filter(con => con.from === connection.from).filter(con => con.to === connection.to)
        if (toUpdate.length !== 1) {
            logger.error(`${JSON.stringify(toUpdate)} should be updated with ${JSON.stringify(connection)}, but it is not a single element => skipping`)
            continue
        }
        toUpdate = toUpdate[0]

        // update properties
        toUpdate.delay = connection.delay
    }

    infrastructure.infra = infra // let's make it explicit
    logger.verbose("Applied connection updates, new connections are " + JSON.stringify(infrastructure.infra.connections))
    return infrastructure
}

/**
 * Sends the given application instructions to the respective application endpoints.
 * 
 * @param {Array} application_instructions the array of application instruction objects
 * @param {Object} deployment the object returned by the deployment.js module function
 * @param {Object} mm - the object returned by the machine-meta.js module function
 * @param {int} agent_port - the port at which the agent runs
 */
async function distributeApplicationInstructions(application_instructions, deployment, mm, agent_port) {
    var replyCount = 0

    return new Promise((resolve) => {
        for (const ai of application_instructions) {
            const target_machines = deployment.getMachineNames(ai.target_container)
            let queryString = ""
            for (const [key, value] of Object.entries(ai.query_strings)) {
                if (queryString === "") {
                    queryString += "?" // add ? if not present
                } else if (queryString !== "?") {
                    queryString += "&" // add & if not first object
                }
                queryString += `${key}=${value}`
            }

            for (const machine of target_machines) {
                const options = {
                    "host": mm.getPublicIP(machine),
                    "port": agent_port,
                    "path": `${ai.path}${queryString}`,
                    "method": "GET"
                }

                http.request(options, (res) => {
                    logger.info(`Sent application instruction to ${ip}, status code is ${res.statusCode}`)
                    replyCount++
                    if (replyCount === application_instructions.length) {
                        logger.info("Distributed all application instructions")
                        resolve()
                    }
                }).end()
            }
        }
    })
}

module.exports = Manager

if (require.main === module) {
    (async () => {
        const manager = new Manager(true)

        await manager.execute_schedule()
    })();
}

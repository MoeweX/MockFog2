const http = require('http')

const orchestrationF = require("../../data/orchestration.js")
const deploymentF = require("../../data/deployment.js")
const infrastructureF = require("../../data/infrastructure.js")

const multiFileFunctions = require("../../data/multi-file.js")
const naService = require("../../services/nodeAgentService.js")
const machineMeta = require("../../data/machine-meta.js")

const TCEvaluator = require("./tc-evaluator.js")

const logger = require("../../services/logService.js")("Orchestration Manager")

class Manager {

    constructor(debug = false) {
        this.debug = debug
        this.states = orchestrationF().states
        this.infrastructure = infrastructureF()
        this.deployment = deploymentF()
        this.tcEvaluator = new TCEvaluator()
        this.status = "idle"
        this.next_state = "initial"
    }

    async execute_schedule() {
        if (this.status !== "idle") {
            logger.warn("Cannot start manager is " + this.status)
            return
        }
        this.status = "executing"

        while (this.status !== "done") {
            const targetStateName = this.next_state
            let targetState = this.states.filter(s => { return s.state_name === targetStateName })[0]
            if (!targetState) {
                logger.error(`There is no state with state_name ${targetStateName}`)
                break
            }

            await this.doTransition(targetState)
            await this.doState(targetState)
        }

        this.status = "idle"
    }

    async doTransition(state) {
        logger.info("Starting transition to state " + state.state_name)
        // resource manipulation
        if (state.resource_manipulation_instructions === "reset") {
            logger.info("Resetting infrastructure manipulations")
            this.infrastructure = infrastructureF()
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
            if (state.application_instructions.length !== 0) {
                await distributeApplicationInstructions(state.application_instructions, this.deployment, mm)
            }
        }
        logger.info("Completed transition to state " + state.state_name)
    }

    async doState(state) {
        logger.info("Doing state " + state.state_name)
        if (state.transition_conditions.length === 0) {
            logger.info("All states completed")
            this.status = "done"
            return
        }

        // TODO notify defined applications about new state, measure notification delay

        // wait until all transition conditions for any subsequent state are fulfilled
        this.next_state = await this.tcEvaluator.activate(state.transition_conditions)
        logger.info(`Completed state ${state.state_name}, transitioning to state ${this.next_state}`)
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
 */

async function distributeApplicationInstructions(application_instructions, deployment, mm) {
    var replyCount = 0

    return new Promise((resolve) => {
        for (const ai of application_instructions) {
            const target_machines = deployment.getMachineNames(ai.target_container)
            const port = ai.port
            
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
                const ip = mm.getPublicIP(machine)

                const options = {
                    "host": ip,
                    "port": port,
                    "path": `${ai.path}${queryString}`,
                    "method": "GET"
                }

                logger.info(`Sending application instruction to ${ip}:${port}`)
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
        const app = require("express")()
        const server = app.listen(3000)
        const tmController = require("../../controller/transitionMessagesController.js")

        const manager = new Manager(true)
        tmController(app, "test", manager.tcEvaluator)

        const interval = setInterval(function() {
            const ip = "localhost"

            const options = {
                "host": ip,
                "port": 3000,
                "path": "/test/transition/message?event_name=dashboard-generated",
                "method": "GET"
            }

            logger.info(`Sending transition message to ${ip}:3000`)
            http.request(options, (res) => {
                logger.info(`Sent transition message to ${ip}, status code is ${res.statusCode}`)
            }).end()
        }, 5000)

        manager.execute_schedule().then(_ => {
            logger.info("Schedlue executed")
            clearInterval(interval)
            server.close()
        })
    })();
}

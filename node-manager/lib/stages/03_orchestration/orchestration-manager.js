const orchestration = require("../../data/orchestration.js")
const multiFileFunctions = require("../../data/multi-file.js")
const naService = require("../../services/nodeAgentService.js")
const machineMeta = require("../../data/machine-meta.js")

const logger = require("../../services/logService.js")("Orchestration Manager")

class Manager {

    constructor(debug = false) {
        this.debug = debug
        this.states = orchestration().states
        this.infrastructure = require("../../data/infrastructure.js")()
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
            const tcconfigs = multiFileFunctions.getTCConfigs(this.infrastructure, machineMeta())
            await naService.distributeTCConfigs(machineMeta(), tcconfigs)
        }

        // TODO application instructions 

    }

    async doState(state) {
        return new Promise(resolve => {
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
            logger.info("Time-based condition: " + time/1000 + "s.")
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

module.exports = Manager

if (require.main === module) {
    (async () => {
        const manager = new Manager(true)

        await manager.execute_schedule()
    })();
}

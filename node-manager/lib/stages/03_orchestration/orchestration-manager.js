const orchestration = require("../../data/orchestration.js")
const multiFileFunctions = require("../../data/multi-file.js")
const naService = require("../../services/nodeAgentService.js")

const logger = require("../../services/logService.js")("Orchestration Manager")

class Manager {

    constructor() {
        this.states = orchestration().states
        this.infrastructure = require("../../data/infrastructure.js")()
        this.machineMeta = require("../../data/machine-meta.js")()
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
            await this.doTransition(state)
            logger.info("Completed state " + state.state_name)
        }

        this.status = "idle"
    }

    async doTransition(state) {
        if (state.resource_manipulation_instructions === "reset") {
            logger.info("Resetting infrastructure manipulations")
            this.infrastructure = require("../../data/infrastructure.js")()
        } else {
            // TODO apply manipulations to this.infrastructure.infra

            // this updates the graph with the newest infra data
            this.infrastructure.graph = this.infrastructure.getGraph(this.infrastructure.infra)
        }

        const tcconfigs = multiFileFunctions.getTCConfigs(this.infrastructure, this.machineMeta)
        naService.distributeTCConfigs(this.machineMeta, tcconfigs)
    }

    async doState(state) {
        
    }

}

module.exports = Manager

if (require.main === module) {
    (async () => {
        const manager = new Manager()

        await manager.execute_schedule()
    })();
}

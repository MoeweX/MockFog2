const http = require('http')

const orchestrationF = require("../../data/orchestration.js")
const deploymentF = require("../../data/deployment.js")
const infrastructureF = require("../../data/infrastructure.js")

const manipulationService = require("../../services/manipulationService.js")
const naService = require("../../services/nodeAgentService.js")
const machineMeta = require("../../data/machine-meta.js")

const TCEvaluator = require("./tc-evaluator.js")

const logger = require("../../services/logService.js")("Orchestration Manager")

class Manager {

    constructor(debug = false) {
        this.debug = debug
        this.states = orchestrationF().states
        this.infrastructureO = infrastructureF()
        this.deploymentO = deploymentF()
        this.tcEvaluator = new TCEvaluator()
        this.status = "idle"
        this.next_state = "initial"
    }

    async execute_schedule() {
        manipulationService.fetch()
        await manipulationService.awaitConnectionDelays()

        if (this.status !== "idle") {
            logger.warn("Cannot start manager as its status is " + this.status)
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
        logger.info("\n\n\nStarting transition to state " + state.state_name)
        // connection_manipulation_instructions
        if (state.connection_manipulation_instructions === "reset") {
            logger.info("Resetting connection manipulations")
            this.infrastructureO.infra.connections = infrastructureF().infra.connections
        } else {
            // apply manipulations to this.infrastructureO.infra
            this.infrastructureO = applyConnectionUpdates(this.infrastructureO, state.connection_manipulation_instructions)
        }
        // this updates the graph with the newest infra data
        this.infrastructureO.graph = this.infrastructureO.getGraph(this.infrastructureO.infra)
        
        // machine_manipulation_instructions
        if (state.machine_manipulation_instructions === "reset") {
            logger.info("Resetting machine manipulations")
            this.infrastructureO.infra.machines = infrastructureF().infra.machines
        } else {
            // apply manipulations to this.infrastructureO.infra
            this.infrastructureO = applyMachineUpdates(this.infrastructureO, state.machine_manipulation_instructions)
        }

        if (!this.debug) {
            const mm = machineMeta()

            // get tcconfigs and distribute them
            const tcconfigs = manipulationService.getTCConfigs(this.infrastructureO, mm)
            await naService.distributeTCConfigs(mm, tcconfigs)

            // get mcLists and distribute them
            await manipulationService.awaitMachineResources()
            const mcrLists = manipulationService.getMCRLists(this.infrastructureO, this.deploymentO)
            await naService.distributeMCRLists(mm, mcrLists)

            // application instructions
            if (state.application_instructions.length !== 0) {
                await distributeApplicationInstructions(state.application_instructions, this.deploymentO, mm)
            }
        }
        logger.info("Completed transition to state " + state.state_name)
    }

    async doState(state) {
        logger.info("\n\n\nDoing state " + state.state_name)

        if (!this.debug) {
            const mm = machineMeta()

            let timestamps = {}

            // distribute state notifications, measure notification delay
            for (sn of state.state_notifications) {
                const target_machines = this.deploymentO.getMachineNames(sn.target_container)
                const port = sn.port

                for (const machine of target_machines) {
                    const ip = mm.getPublicIP(machine)

                    const options = {
                        "host": ip,
                        "port": port,
                        "path": sn.path + "?state_name=" + state.state_name,
                        "method": "GET",
                        time: true
                    }

                    logger.verbose(`Sending state notification to ${ip}:${port}`)

                    timestamps[options.host] = process.hrtime()
                    http.request(options, (res) => {
                        const delay = calculateTimeDiff(timestamps[options.host], process.hrtime())
                        logger.info(`Notification acknowledgement delay for ${options.host} was ${delay}ms, status code is ${res.statusCode}`)
                    }).end()
                }
            }
        }

        if (state.transition_conditions.length === 0) {
            logger.info("All states completed\n\n\n")
            this.status = "done"
            return
        }

        // wait until all transition conditions for any subsequent state are fulfilled
        this.next_state = await this.tcEvaluator.activate(state.transition_conditions)
        logger.info(`Completed state ${state.state_name}, transitioning to state ${this.next_state}`)
    }

}

/**
* Calculate the time difference in milliseconds from process.hrtime()
* @param {Array} startTime - [seconds, nanoseconds]
* @param {Array} endTime - [seconds, nanoseconds]
* @return {Number} time difference in ms
*/
function calculateTimeDiff(startTime, endTime) {
    const NS_PER_SEC = 1e9
    const MS_PER_NS = 1e6

    const secondDiff = endTime[0] - startTime[0]
    const nanoSecondDiff = endTime[1] - startTime[1]
    const diffInNanoSecond = secondDiff * NS_PER_SEC + nanoSecondDiff

    return diffInNanoSecond / MS_PER_NS
}

/**
 * Replaces connection information in the given infrastructure object with same from/to as found in the given connection_manipulation_instructions
 * 
 * @param {Object} infrastructure the object returned by the infrastructure.js module function
 * @param {*} connection_updates the new connection_manipulation_instructions to use
 * @return the updated infrastructure, if connection_updates is undefined/emptry, returns the original infrastructure
 */
function applyConnectionUpdates(infrastructure, connection_updates) {
    if (!connection_updates || connection_updates.length === 0) {
        return infrastructure
    }

    const infra = infrastructure.infra

    for (const connection of connection_updates) {
        // find connection
        let toUpdate = infra.connections.filter(con => con.from === connection.from).filter(con => con.to === connection.to)
        if (toUpdate.length === 0) {
            toUpdate = infra.connections.filter(con => con.to === connection.from).filter(con => con.from === connection.to);
            toUpdate.forEach(element => {
                const tmp = element.to;
                element.to = element.from;
                element.from = tmp;
            });
        }
        if (toUpdate.length === 0) {
            logger.error(`No connection found which should be updated with ${JSON.stringify(connection)} => skipping`)
            // TODO add new connection if not found
            continue
        } else if (toUpdate.length !== 1) {
            logger.error(`${JSON.stringify(toUpdate)} should be updated with ${JSON.stringify(connection)}, but it is not a single element => skipping`)
            // TODO add new connection if not found
            continue
        }
        toUpdate = toUpdate[0]

        // update properties
        toUpdate.delay = connection.delay || toUpdate.delay
        toUpdate.rate = connection.rate || toUpdate.rate
        toUpdate["delay-distro"] = connection["delay-distro"] || toUpdate["delay-distro"]
        toUpdate.duplicate = connection.duplicate || toUpdate.duplicate
        toUpdate.loss = connection.loss || toUpdate.loss
        toUpdate.corrupt = connection.corrupt || toUpdate.corrupt
        toUpdate.reordering = connection.reorderin || toUpdate.reordering
    }

    infrastructure.infra = infra // let's make it explicit
    logger.info("Applied connection updates, new connections are " + JSON.stringify(infrastructure.infra.connections))
    return infrastructure
}

/**
 * Replaces machine information in the given infrastructure object with same from/to as found in the given machine_manipulation_instructions
 * 
 * @param {Object} infrastructure the object returned by the infrastructure.js module function
 * @param {*} machine_updates the new machine_manipulation_instructions to use
 * @return the updated infrastructure, if machine_updates is undefined/emptry, returns the original infrastructure
 */
function applyMachineUpdates(infrastructure, machine_updates) {
    if (!machine_updates || machine_updates.length === 0) {
        return infrastructure
    }

    const infra = infrastructure.infra

    for (const mu of machine_updates) {
        // find machine
        let toUpdate = infra.machines.filter(m => m.machine_name === mu.machine_name)[0]

        // update properties
        toUpdate.memory = mu.memory || toUpdate.memory
        toUpdate.cpu = mu.cpu || toUpdate.cpu
    }

    infrastructure.infra = infra // let's make it explicit
    logger.info("Applied machine updates, new machines are " + JSON.stringify(infrastructure.infra.machines))
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
                    logger.info(`Sent application instruction to ${options.host}, status code is ${res.statusCode}`)
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

        const interval = setInterval(function () {
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
            logger.info("Schedule executed")
            clearInterval(interval)
            server.close()
        })
    })();
}

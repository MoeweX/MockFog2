const assert = require("assert");

const infrastructureF = require("../../lib/data/infrastructure.js");

const fileLocation = __dirname + "/../resources/infrastructure.jsonc"

function updateConnection(infra, newConnection) {
    let found = false
    for (var i = 0; i < infra.connections.length; i++) {
        const connection = infra.connections[i]
        if (connection.to === newConnection.to && connection.from === newConnection.from) {
            infra.connections.splice(i, 1)
            found = true
            break
        } else if (connection.to === newConnection.from && connection.from === newConnection.to) {
            infra.connections.splice(i, 1)
            found = true
            break
        }
    }
    if (found === false) {
        console.log(`No connection to ${to} from ${from} exists.`)
    }
    infra.connections.push(newConnection)
}

describe("Infrastructure", function () {
    describe("module function", function () {
        it("should return an object that has an infra field", function () {
            const infrastructure = infrastructureF(fileLocation)
            assert(infrastructure.infra != undefined)
        })
    })

    describe("#getOneHopEdges", function () {
        const infraO = infrastructureF(fileLocation)

        it("Packaging Machine connects to Wireless Gateway", function () {
            const ohe = infraO._getOneHopEdges("packaging-machine", infraO.infra.connections)
            assert(ohe["wireless-gateway"] === 2)
        })

        it("Cloud connects to Factory Server and Central Office Server", function () {
            const ohe = infraO._getOneHopEdges("cloud", infraO.infra.connections)
            assert(ohe["factory-server"] === 12)
            assert(ohe["central-office-server"] === 10)
        })

        it("Cloud does not connect to Wireless Gateway", function () {
            const ohe = infraO._getOneHopEdges("cloud", infraO.infra.connections)
            assert(ohe["wireless-gateways"] === undefined)
        })
    })

    describe("#calculatePathDuplicate", function () {

        it("nothing leads to 0", function () {
            const infraO = infrastructureF(fileLocation)
            const p = infraO.calculatePathDuplicate(["packaging-machine", "wireless-gateway", "factory-server"])
            assert(p === 0.0)
        })

        it("one 0.1 leads to 0.1", function () {
            const infraO = infrastructureF(fileLocation)
            const newConnection = {
                "from": "wireless-gateway",
                "to": "packaging-machine",
                "delay": 2,
                "duplicate": 0.1
            }
            updateConnection(infraO.infra, newConnection)
            const p = infraO.calculatePathDuplicate(["packaging-machine", "wireless-gateway"])
            assert(p > 0.099)
            assert(p < 0.101)
        })

        it("one 0.1 and one 0.25 leads to 0.325", function () {
            const infraO = infrastructureF(fileLocation)
            const nC1 = {
                "from": "wireless-gateway",
                "to": "packaging-machine",
                "delay": 2,
                "duplicate": 0.1
            }
            const nC2 = {
                "from": "wireless-gateway",
                "to": "factory-server",
                "delay": 1,
                "duplicate": 0.25
            }
            updateConnection(infraO.infra, nC1)
            updateConnection(infraO.infra, nC2)
            const p = infraO.calculatePathDuplicate(["packaging-machine", "wireless-gateway", "factory-server"])
            assert(p > 0.324)
            assert(p < 0.326)
        })

    })
})
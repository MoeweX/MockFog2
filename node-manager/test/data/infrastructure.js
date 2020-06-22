const assert = require("assert");

const infrastructureF = require("../../lib/data/infrastructure.js");

const fileLocation = __dirname + "/../resources/infrastructure.jsonc"

describe("Infrastructure", function () {
    describe("module function", function () {
        it("should return an object that has an infra field", function () {
            const infrastructure = infrastructureF(fileLocation)
            assert(infrastructure.infra != undefined)
        })
    })

    describe("#getOneHopEdges", function() {
        const infraO = infrastructureF(fileLocation)

        it("Packaging Machine connects to Wireless Gateway", function() {
            const ohe = infraO._getOneHopEdges("packaging-machine", infraO.infra.connections)
            assert(ohe["wireless-gateway"] === 2)
        })

        it("Cloud connects to Factory Server and Central Office Server", function() {
            const ohe = infraO._getOneHopEdges("cloud", infraO.infra.connections)
            assert(ohe["factory-server"] === 12)
            assert(ohe["central-office-server"] === 10)
        })

        it("Cloud does not connect to Wireless Gateway", function() {
            const ohe = infraO._getOneHopEdges("cloud", infraO.infra.connections)
            assert(ohe["wireless-gateways"] === undefined)
        })
    })
})
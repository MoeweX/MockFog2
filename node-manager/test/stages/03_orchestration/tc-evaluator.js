const assert = require("assert");
const TCEvaluator = require("../../../lib/stages/03_orchestration/tc-evaluator.js")

const messageBased = [
    {
        "type": "message-based",
        "event_name": "e1",
        "threshold": 1,
        "next_state": "s1"
    },
    {
        "type": "message-based",
        "event_name": "e2",
        "threshold": 1,
        "next_state": "s1"
    },
    {
        "type": "message-based",
        "event_name": "e3",
        "threshold": 3,
        "next_state": "s2"
    }
]

const timeBased = [
    {
        "type": "time-based",
        "active-for": 5,
        "next_state": "s1"
    },
    {
        "type": "time-based",
        "active-for": 10,
        "next_state": "s2"
    },
    {
        "type": "time-based",
        "active-for": 15,
        "next_state": "s3"
    },
    {
        "type": "time-based",
        "active-for": 20,
        "next_state": "s3"
    }
]

const all = timeBased.concat(messageBased)

function clone(arr) {
    return JSON.parse(JSON.stringify(arr))
}

describe("TCEvaluator", function () {
    describe("#_mapConditions", function () {
        it("should map message-based conditions correctly", function () {
            const tce = new TCEvaluator()
            const res = tce._mapConditions(messageBased)
            assert(res["s1"].length === 2)
            assert(res["s2"].length === 1)
            assert(res["s2"][0].event_name === "e3")
        })

        it("should map time-based conditions correctly", function () {
            const tce = new TCEvaluator()
            const res = tce._mapConditions(timeBased)
            assert(res["s1"].length === 1)
            assert(res["s2"].length === 1)
            assert(res["s3"].length === 2)
            assert(res["s1"][0]["active-for"] === 5)
            assert(res["s2"][0]["active-for"] === 10)
        })

        it("should map time-based and message-based conditions correctly", function () {
            const tce = new TCEvaluator()
            const res = tce._mapConditions(all)
            assert(res["s1"].length === 3)
            assert(res["s2"].length === 2)
            assert(res["s3"].length === 2)
        })
    })

    describe("#_getTBC", function () {
        it("should return all time-based conditions", function () {
            const tce = new TCEvaluator()
            tce._activeConditions = tce._mapConditions(all)
            assert(tce._getTBC().length === 4)
            assert(tce._getTBC()[0]["active-for"] !== undefined)
            assert(tce._getTBC()[0]["event_name"] === undefined)
        })
    })

    describe("#_getMBC", function () {
        it("should return all message-based conditions", function () {
            const tce = new TCEvaluator()
            tce._activeConditions = tce._mapConditions(all)
            assert(tce._getMBC().length === 3)
            assert(tce._getMBC()[0]["active-for"] === undefined)
            assert(tce._getMBC()[0]["event_name"] !== undefined)
        })
    })

    describe("#_removeCondition", function () {
        it("should remove the correct condition", function () {
            const tce = new TCEvaluator()
            tce._activeConditions = tce._mapConditions(all)
            tce._removeCondition({})
            assert(tce._activeConditions["s1"].length === 3)
            assert(tce._activeConditions["s2"].length === 2)
            assert(tce._activeConditions["s3"].length === 2)
            tce._removeCondition(timeBased[1])
            assert(tce._activeConditions["s1"].length === 3)
            assert(tce._activeConditions["s2"].length === 1)
            assert(tce._activeConditions["s3"].length === 2)
        })
    })

    describe("#activate", function () {
        it("should resolve when time-based condition met (1)", async function () {
            const tce = new TCEvaluator()
            const nextState = await tce.activate(timeBased)
            assert(nextState === "s1")
            assert(tce.active === false)
        })

        it("should resolve when time-based condition met (2)", async function () {
            const tce = new TCEvaluator()
            const nextState = await tce.activate(timeBased.concat([{
                "type": "time-based",
                "active-for": 15,
                "next_state": "s1"
            }]))
            assert(nextState === "s2")
            assert(tce.active === false)
        })

        it("should resolve when message-based condition met (1)", function (done) {
            const tce = new TCEvaluator()
            tce.activate(clone(messageBased)).then(nextState => {
                assert(nextState === "s2")
                assert(tce.active === false)
                done()
            })
            // threshold is 3
            tce.addEvent("e3")
            tce.addEvent("e3")
            tce.addEvent("e3")
        })

        it("should resolve when message-based condition met (2)", function(done) {
            const tce = new TCEvaluator()
            tce.activate(clone(messageBased)).then(nextState => {
                assert(nextState === "s1")
                assert(tce.active === false)
                done()
            })
            // two e3 are not enough for s2
            tce.addEvent("e3")
            tce.addEvent("e3")
            // s1 requires one e1 and one e2
            tce.addEvent("e1")
            tce.addEvent("e2")
        })

        it("should resolve when all conditions are met (1)", function(done) {
            const tce = new TCEvaluator()
            tce.activate(clone(all)).then(nextState => {
                assert(nextState === "s1")
                assert(tce.active === false)
                done()
            })
            // s1 requires one e1 and one e2
            tce.addEvent("e1")
            tce.addEvent("e2")
        })

        it("should resolve when all conditions are met (2)", function(done) {
            const tce = new TCEvaluator()
            tce.activate(clone(all)).then(nextState => {
                assert(nextState === "s3")
                assert(tce.active === false)
                done()
            })
            // no events -> s3 completes after 20ms
        })
    })

})
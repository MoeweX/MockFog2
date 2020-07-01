const assert = require("assert");

const config = require("../lib/config.js")

describe("Config", function() {
    describe("#nmAddress", function() {
        it("should be set eventually", function(done) {
            const checkAndRepeat = function() {
                if (config.getNMaddress() === "notSetYet") {
                    setTimeout(checkAndRepeat, 10) // this field is updated asynchronously, hence the timeout
                } else {
                    done()
                }
            }

            checkAndRepeat()
        })
    })

})
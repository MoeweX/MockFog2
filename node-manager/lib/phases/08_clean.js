const fs = require("fs")
const path = require("path")
const rimraf = require("rimraf");

const conf = require("../config.js")

const logger = require("../services/logService.js")("clean")

function clean() {

    fs.readdir(conf.runDir, { encoding: "utf-8" }, function (err, files) {
        if (err) throw err

        for (const f of files) {
            filepath = conf.runDir + f
            if (filepath + "/" === conf.runConfigDir) {
                // do not delete config
            } else {
                rimraf.sync(filepath)
                logger.info("Deleted recursivly " + filepath)
            }

        }

    })

}

if (require.main === module) {
    clean()
}

module.exports = clean

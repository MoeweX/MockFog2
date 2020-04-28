const fs = require("fs")
const path = require("path")

const conf = require("./config.js")

/**
 * Deletes all files in the run dir that are not inside the run/config directory.
 */
function clean() {

    const dirs = [conf.runDir, conf.runLogDir, conf.runPlaybookVarDir]

    for (const dir of dirs) {
        fs.readdir(dir, {"withFileTypes": true}, function(err, files) {
            if (err) throw err
            deleteNotHiddenFiles(dir, files)
        })
    }
}

function deleteNotHiddenFiles(dir, files) {
    for (file of files) {
        const p = path.join(dir, file.name)

        if (file.isFile() && !file.name.startsWith(".")) {
            fs.unlink(p, (err) => { 
                if (err) throw err 
                console.log("Deleted " + p)
            })
        }
    }
}

module.exports = clean

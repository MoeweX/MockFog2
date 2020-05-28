const fs = require("fs")
const fsp = fs.promises
const rimraf = require("rimraf");

const infrastructure = require("../../data/infrastructure.js")
const common = require("../common.js")
const Phase = require("../phase.js")

const conf = require("../../config.js")

class Child extends Phase {

    constructor(phaseName) {
        super(phaseName)

        this.varPath = conf.runPlaybookVarDir + "0104_destroy.yml"
        this.playbookPath = conf.playbookDir + "0104_destroy.yml"
        this.playbookLogPath = conf.runLogDir + "0104_destroy-playlog.log"
    }

    async parseInput() {
        this.infra = infrastructure()
    }

    async runPrePlaybookTasks() {
        // write var file
        await fsp.writeFile(this.varPath, this.infra.awsYML + this.infra.machinesYML)
        this.logger.info("Destroy playbook vars written to " + this.varPath)

        // create playbook object
        this.playbook = new common.Playbook(this.playbookPath, this.varPath)
    }

    async cleanUp() {
        const phase = this;
        return new Promise(resolve => {
            fs.readdir(conf.runDir, { encoding: "utf-8" }, function (err, files) {
                if (err) throw err

                for (const f of files) {
                    const filepath = conf.runDir + f
                    if (filepath + "/" === conf.runConfigDir) {
                        // do not delete config
                    } else {
                        rimraf.sync(filepath)
                        phase.logger.info("Deleted recursivly " + filepath)
                    }
                }

                resolve()
            })
        })
    }

}

module.exports = Child

if (require.main === module) {
    (async () => {
        const child = new Child("Destroy")

        await child.parseInput()
        await child.runPrePlaybookTasks()
        await child.executePlaybook()
        await child.runPostPlaybookTasks()
        await child.cleanUp()
    })();
}

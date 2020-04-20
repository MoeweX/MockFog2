const fs = require("fs");
const stripJson = require("strip-json-comments");

const conf = require("../config.js")

function getAWSYml(aws) {
    return `---
ec2_region: ${aws.ec2_region}
ssh_key_name: ${aws.ssh_key_name}\n`
}

function getMachinesYml(machines) {
    let ymlString = "machines:\n"

    machines.forEach(machine => {
        ymlString = ymlString + `
- machine_name: ${machine.machine_name}
  type: ${machine.type}
  image: ${machine.image}`
    });

    return ymlString + "\n"
}

// errors should stop program, so do not catch
const infraJson = fs.readFileSync(conf.runConfigDir + "infrastructure.json", "utf-8")
const infra = JSON.parse(stripJson(infraJson))

console.log("Infrastructure loaded.")

module.exports = {
    awsYML: getAWSYml(infra.aws),
    machinesYML: getMachinesYml(infra.machines)
}
const fs = require("fs");
const stripJson = require("strip-json-comments");

const conf = require("../config.js")

function getYml(aws, machines) {
    let ymlString = `---
ec2_region: ${aws.ec2_region}
ssh_key_name: ${aws.ssh_key_name}
machines:`

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

const ymlString = getYml(infra.aws, infra.machines)
console.log("Infrastructure loaded.")

module.exports = {
    ymlString: ymlString
}
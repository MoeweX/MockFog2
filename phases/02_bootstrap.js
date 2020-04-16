const fs = require("fs");
const stripJson = require("strip-json-comments");
const spawn = require("child_process").spawn;

function bootstrap() {
    console.log("Starting bootstrapping of infrastructure")

    // read in infrastructure.json
    try {
        var path = __dirname + "/../run/config/infrastructure.json"
        var content = fs.readFileSync(path, "utf-8")
    } catch(error) {
        if (error.code === "ENOENT") {
            console.log(`No file found at ${path}`)
            return
        }
        console.log(error)
        return
    }

    // convert to object
    const cleanedJson = stripJson(content)
    const infra = JSON.parse(cleanedJson)
    console.log(`Infrastructure definition: ${JSON.stringify(infra)}`)

    // create var file
    let ymlString = getYml(infra.aws, infra.machines)
    try {
        path = __dirname + "/../run/vars/02_bootstrap.yml"
        fs.writeFileSync(path, ymlString)
    } catch(error) {
        console.log(error)
        return
    }
    console.log(`Boostrap playbook vars:\n${ymlString}`)

    // start playbook
    console.log("Starting playbook")
    runPlaybook()
    console.log("Playbook finished")
}

function getYml(aws, machines) {
    let ymlString = `---
ec2_region: ${aws.ec2_region}
ssh_key_name: ${aws.ssh_key_name}
machines:`

    machines.forEach(machine => {
        ymlString = ymlString + `
- machine_name: ${machine.machine_name}
  type: ${machine.type}
  image: ${machine.image}`});

    return ymlString + "\n"
}

function runPlaybook() {
    const playbookPath = __dirname + "/../playbooks/02_bootstrap.yml"
    const varPath = __dirname + "/../run/vars/02_bootstrap.yml"

    if (!fs.existsSync(playbookPath)) {
        console.log(`Playbook could not be started as ${playbookPath} does not exist`)
        return
    }

    if (!fs.existsSync(varPath)) {
        console.log(`Playbook could not be started as ${varPath} does not exist`)
        return
    }

    const playbook = spawn("ansible-playbook", 
        ["--ssh-common-args=\"-o StrictHostKeyChecking=no\"", playbookPath, `--extra-vars=@${varPath}`]);

    playbook.stdout.on("data", data => {
        console.log(`${data}`);
    });

    playbook.stderr.on("data", data => {
        console.log(`${data}`);
    });

    playbook.on('error', (error) => {
        console.log(`error: ${error.message}`);
    });

    playbook.on("close", code => {
        console.log(`Playbook finished, exited with code ${code}`);
    });
}

module.exports = bootstrap

// uncomment to make executeable
// bootstrap()
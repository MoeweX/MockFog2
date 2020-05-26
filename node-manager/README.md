# MockFog2 Node Manager

The Node Manager is configured by the three configuration files found in the config directory:
- infrastructure.json: defines machines and dependencies
- containers.json: defines docker containers + application specific configurations (not supported, yet)
- deployment.json defines how containers are deployed on the infrastructure (not supported, yet)
To remove comments from the JSON files, use https://www.npmjs.com/package/strip-json-comments.

The node manager uses ansible playbooks under the hood for all infrastructure/provisioning related tasks.

## Phases

In general, one should consecutively run through the phases described below.
Each phase generates files needed for execution based on priorly generated files (also see run-example directory).

Before you begin, you have to create/update configurations in `run/config` directory, json comments will be automatically removed with [strip-json-comments](https://www.npmjs.com/package/strip-json-comments).

More phases will be added in later versions of MockFog2.

### 02 Bootstrap
You should:
 - Run `node app.js bootstrap`

This:
- Creates a var file for the bootstrap playbook, stores at `run/vars/bootstrap.yml`
- Bootstraps the infrastructure on AWS
    - Setup a VPC
    - Setup a management subnet (access to internet, only ssh)
    - Setup an internal subnet (access to all other machines, all traffic)
    - Start EC2 instances that are part of this VPC
- Pulls ssh key and writes it to `./<configured name>`.
- Pulls machine facts and writes them to `run/machine_meta.json`

### 03 Hosts
You should:
- Run `node app.js host`

This:
- Uses the configurations and machine meta data to prepare the ansible inventory that makes machines accessible by their machine_name and by container_name
- Stores at `run/hosts`

### 04 Agent
You should:
- Run `node app.js agent`

This:
- Creates a var file for the agent playbook, stores at `run/vars/agent.yml`
- Installs pre-requisits on EC2 instances
- Generates one tcconfig file per machine and stores them at `run/<machine_name>/tcconfig.json`
- Copies the tcconfig settings to each remote and applies them using `tcset`
- Copies the node agent to each remote and starts it

The node agent offers a REST-API that can be used to apply subsequent changes to the network.

### 07 Destroy
You should:
- Run `node app.js destroy`

This:
- Creates a var file for the destroy playbook, stores at `run/vars/destroy.yml`
- Destroys the VPC and all EC2 instances that have been part of the VPC

### 08 Clean
You should:
- Run `node app.js clean`

This:
- Deletes all files in the `run`directory that are not located in `./run/config`.

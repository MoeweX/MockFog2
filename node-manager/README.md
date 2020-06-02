# MockFog2 Node Manager

The Node Manager is configured by the three configuration files found in the config directory:
- infrastructure.jsonc: defines machines and dependencies
- containers.jsonc: defines docker containers + application specific configurations (not supported, yet)
- deployment.jsonc defines how containers are deployed on the infrastructure (not supported, yet)
To remove comments from the JSON files, use https://www.npmjs.com/package/strip-json-comments.

Before you begin using the node manager, you have to create/update configurations in `run/config` directory, json comments will be automatically removed with [strip-json-comments](https://www.npmjs.com/package/strip-json-comments).
The node manager uses ansible playbooks under the hood for all infrastructure/provisioning related tasks.

## Stages and Phases

Depending on the current stage, MockFog2 makes it possible to emulate a fog computing infrastructure, manage the lifecycle of a fog application, and orchestrate experiments with that application:

![](../misc/Stages.png)

Each stage comprises multiple phases that should, in general, be run consecutively.
At the moment, the easiest way of running a phase is through the command line.

### Stage 1

![](../misc/Stage1-01_Bootstrap.png)

Start this phase by running `node app.js bootstrap`, this:
- Creates a var file for the bootstrap playbook at `run/vars/`
- Bootstraps the infrastructure on AWS
    - Setup a VPC
    - Setup a management subnet (access to internet, only ssh and node agent) -> mapped to eth0
    - Setup an internal subnet (access to all other machines, all traffic) -> mapped to eth1
    - Start EC2 instances that are part of this VPC
- Pulls ssh key and writes it to `run/<configured name>.pem`.
- Pulls machine facts and writes them to `run/machine_meta.jsonc`
- Uses the configurations and machine facts data to prepare the ansible inventory that makes machines accessible by their machine_name and by container_name and writes it to `run/hosts`

![](../misc/Stage1-02_Agent.png)

Start this phase by running `node app.js agent`, this:
- Creates a var file for the agent playbook at `run/vars/`
- Installs pre-requisits on EC2 instances
- Copies the node agent to each remote and starts it

The node agent offers a REST-API that can be used to apply subsequent changes to the network.

![](../misc/Stage1-03_Manipulate.png)

Start this phase by running `node app.js manipulate`, this:
- Generates one tcconfig file per machine and stores them at `run/<machine_name>/tcconfig.json`
- Uses HTTP Put request to supply the corresponding tcconfig to each agent

![](../misc/Stage1-04_Destroy.png)

Start this phase by running `node app.js destroy`, this:
- Creates a var file for the destroy playbook, stores at `run/vars/`
- Destroys the VPC and all EC2 instances that have been part of the VPC
- Deletes all local files in the `run` directory that are not located in `./run/config`.

## Actions per Phase

Internally, each phase can comprise up to five standardized actions.
These actions are executed by the node manager and do not require user intervention.

![](../misc/Actions.png)

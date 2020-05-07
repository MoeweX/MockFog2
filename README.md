[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/MoeweX/MockFog2) 

# MockFog2

TODO: what is MockFog?

Key differences to MockFogLight
- Definition solely based on config files, no source code changes necessary to start an application
- All application components are deployed with docker
- Does not use ec2 inventory
- Uses node and npm to manage phases
- Network characteristics can be changed at runtime and on a per-container level
- No pre-requitits for ami, just needs to be Amazon Linux 2

MockFog2 is configured by the three configuration files found in the config directory:
- infrastructure.json: defines machines and dependencies
- containers.json: defines docker containers + application specific configurations
- deployment.json defines how containers are deployed on the infrastructure
To remove comments from the JSON files, use https://www.npmjs.com/package/strip-json-comments.

## Environment Setup using Gitpod
- Open the repository or an individual issue/PR in [Gitpod](https://www.gitpod.io/docs/getting-started/)
- Set the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables in your [Gitpod settings](https://www.gitpod.io/docs/environment-variables/)
- Copy and customize the infrastructure.jsonc file from the `examples/config` directory to the `run/config` directory
- You can now use MockFog2, bootstrap your infrastructure by running `node app.js bootstrap`

## Phases

In general, one should consecutively run through the phases described below.
The `mockfog2` [binary](https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e) ensures that prior phases have been completed before running the next phase.

Before you begin, you have to:
- Setup MockFog2 (python, node, aws config, rsync etc.)
- Create/update configurations in `run/config` directory, json comments will be automatically removed with [strip-json-comments](https://www.npmjs.com/package/strip-json-comments).
- Prepare all files necessary for docker containers as defined in container.json

Features that have to be added to phases:
- Memory limit/CPU share manipulation: https://docs.docker.com/engine/api/v1.30/
- Bind API to TCP socket: https://success.docker.com/article/how-do-i-enable-the-remote-api-for-dockerd

### 01 Visualize
You should:
- Run `mockfog2 visualize`

This:
- Parses all config files and checks them for errors/inconsistencies
- Creates a graph visualization

### 02 Bootstrap
You should:
 - Run `mockfog2 bootstrap`

This:
- Creates var files for the destroy and bootstrap playbooks, stores at `run/vars/bootstrap.yml` and `run/vars/destroy.yml`
- Bootstraps the infrastructure on AWS
    - Setup a VPC
    - Setup a management subnet (access to internet, only ssh)
    - Setup an internal subnet (access to all other machines, all traffic)
    - Start EC2 instances that are part of this VPC
- Pulls machine facts and writes them to `run/machine_meta.json`

### 03 Host Preparation
You should:
- Run `mockfog2 host`

This:
- Uses the configurations and machine meta data to prepare the ansible inventory that makes machines accessible by their machine_name and by container_name
- Stores at `run/hosts`

### 04 Agent
You should:
- Run `mockfog2 agent`

This:
- Installs pre-requisits
- Generates one tcconfig file per machine and stores them at `run/<machine_name>/tcconfig.json`
- Copies the tcconfig settings to each remote and applies them using `tcset`
- Copies the node agent to each remote and starts it

The node agent offers a REST-API that can be used to apply subsequent changes to the network.

### 05 Application
You should:
- Run `mockfog2 application`

This:
- Processes all .template files defined in container.json
- Prepares and runs `playbooks/05_application.yml` based on its .template file
    - Generates an appropriate docker_container tag for each JSON object in container.json
    - Which to run for what machines is defined in ansible hosts file

### 06 Collect
TODO

### 07 Destroy
You should:
- Run `mockfog2 destroy`

This:
- Destroys the VPC and all EC2 instances that have been part of the VPC

### 08 Clean
You should:
- Run `mockfog2 clean`

This:
- Deletes all not-hidden files in the `./run` directory that are not placed in `./run/config`.
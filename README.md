# MockFog2

TODO: what is MockFog?

Key differences to MockFogLight
- Definition solely based on config files, no source code changes necessary to start an application
- All application components are deployed with docker
- Does not use ec2 inventory
- Uses node and npm to manage phases
- Network characteristics can be changed at runtime and on a per-container level

MockFog2 is configured by the three configuration files found in the config directory:
- infrastructure.json: defines machines and dependencies
- containers.json: defines docker containers + application specific configurations
- deployment.json defines how containers are deployed on the infrastructure
To remove comments from the JSON files, use https://www.npmjs.com/package/strip-json-comments.

## Phases

In general, one should consecutively run through the phases described below.
The `mockfog2` [binary](https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e) ensures that prior phases have been completed before running the next phase.

Before you begin, you have to:
- Setup MockFog2 (python, aws config, etc.)
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
- Creates a var file that contains all information needed by `playbooks/02_bootstrap.yml`, stores at `run/vars/bootstrap.yml`
- Bootstraps the infrastructure on AWS
    - Setup a VPC
    - Setup a management subnet (access to internet, only ssh)
    - Setup an internal subnet (access to all other machines, all traffic)
    - Start EC2 instances that are part of this VPC
- Pulls machine meta data: machine_name, external_ip, internal_ip (affected by delay), stores at `run/machine_meta.txt`

### 03 Host Preparation
You should:
- Run `mockfog2 host`

This:
- Uses the configurations and machine meta data to prepare the ansible inventory that makes machines accessible by their machine_name and by container_name
- Stores at `run/hosts`

### 04 Network
You should:
- Run `mockfog2 network`

This (Option 1):
- Generates one network delays file per machine and stores them at `run/<machine_name>/delays.txt`
- Generates one network configuration file per machine and stores them at `run/<machine_name>/configure_network.sh`
- Copies and executes these files on the individual machines (can be done by [looping over hosts](https://stackoverflow.com/questions/33316586/how-to-loop-over-hostnames-or-ips-in-ansible))

This (Option 2):
- Generates one network delays file per machine and stores them at `run/<machine_name>/delays.txt`
- Starts docker-tc on all machines (https://github.com/lukaszlach/docker-tc#http-api)
- Sends a post request to each demon to set initial network configuration

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
- Run `./destroy.sh`

This:
- Destroys the VPC and all EC2 instances that have been part of the VPC

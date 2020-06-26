/**
 * Returns an array of tcconfig that can be restored by https://tcconfig.readthedocs.io/en/latest/index.html for each machine part of the defined infrastructure.
 * 
 * @param {Object} infrastructure the object returned by the infrastructure.js module function
 * @param {Object} machineMeta the object returned by the machine-meta.js module function
 */
function getTCConfigs(infrastructure, machineMeta) {
    // setup fields
    const machines = infrastructure.infra.machines
    const graph = infrastructure.graph
    const getInternalIP = machineMeta.getInternalIP // this is a function

    const tcConfig = {}

    machines.forEach(start => {
        let fillerId = 800
        const outgoing = {}

        for (const target of machines) {
            if (start.machine_name === target.machine_name) continue

            const route = graph.path(start.machine_name, target.machine_name, { cost: true })
            const path = route.path

            // variable names are also the key names for tcconfig if not specified otherwise
            const delay = route.cost
            const rate = infrastructure.calculatePathRate(path, true)
            const delayDistro = infrastructure.calculatePathDelayDistro(path) // keyname must be delay-distro
            const duplicate  = infrastructure.calculatePathDuplicate(path)
            const loss = infrastructure.calculatePathLoss(path)
            const corrupt = infrastructure.calculatePathCorrupt(path)
            const reordering = infrastructure.calculatePathReordering(path)

            outgoing[`dst-network=${getInternalIP(target.machine_name)}/32, protocol=ip`] = {
                machine_name: target.machine_name,
                filler_id: `800:${fillerId}`,
                delay: delay,
                rate: rate,
                "delay-distro": delayDistro,
                duplicate: duplicate,
                loss: loss,
                corrupt: corrupt,
                reordering: reordering
            }

            fillerId++
        }

        tcConfig[start.machine_name] = {
            "eth0": {
                "outgoing": {},
                "incoming": {}
            },
            "eth1": {
                "outgoing": outgoing,
                "incoming": {}
            }
        }
    })

    return tcConfig
}

/**
 * 
 * Returns a string that comprises all container names in seperate lines.
 * 
 * @param {Object} container the object return by the container.js module function
 */
function getContainerChildren(container) {
    return container.containerNames.join("\n")
}

/**
 * 
 * Returns information on each container in the following form:
 *  [camera]
 *  ec2-35-159-18-33.eu-central-1.compute.amazonaws.com machine_name=edge2 internal_ip=10.0.2.4
 * 
 * @param {Object} container the object return by the container.js module function
 * @param {Object} deployment the object return by the deployment.js module function
 * @param {Object} machineMeta the object returned by the machine-meta.js module function
 */
function getHostContainerDetails(container, deployment, machineMeta) {
    let result = ""
    for (const cn of container.containerNames) {
        result = result + `\n[${cn}]\n`
        for (const mn of deployment.getMachineNames(cn)) {
            result = result + `${machineMeta.getPublicIP(mn)} machine_name=${mn} internal_ip=${machineMeta.getInternalIP(mn)}\n`
        }
    }
    return result
}

/**
 * Returns an ansible hosts file that contains all machines being part of the infrastructure.
 * Machines are addressable by their machine_name and by container_name
 * 
 * 
 * @param {Object} machineMeta the object returned by the machine-meta.js module function
 * @param {Object} container the object return by the container.js module function
 * @param {Object} deployment the object return by the deployment.js module function
 */
function getHosts(machineMeta, container, deployment) {

    const hostsDataObject = machineMeta.hostsDataObject

    return `[all:vars]
ansible_ssh_user=ec2-user
ansible_ssh_common_args='-o StrictHostKeyChecking=no'

# ---------------------------------------
# Hosts by machine_name
# ---------------------------------------

[machines:children]
${hostsDataObject["machines:children"]}

${hostsDataObject["machineGroups"]}

# ---------------------------------------
# Hosts by container_names
# ---------------------------------------

[container:children]
${getContainerChildren(container)}
${getHostContainerDetails(container, deployment, machineMeta)}
`
}

module.exports = {
    getTCConfigs: getTCConfigs,
    getHosts: getHosts
}
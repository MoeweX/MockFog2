const fs = require("fs");
const stripJson = require("strip-json-comments");

const conf = require("../config.js")

/**
 * Returns the instance object that has a name tag which is equal to the given machine_name.
 * Returns undefined if no such instance exists.
 * 
 * @param {Object} machine_name 
 * @param {Object} instances the machine meta json instances object
 */
function getInstance(machine_name, instances) {
    for (const instance of instances) {
        if (instance.tags.Name === machine_name) {
            return instance
        }
    }
}

/**
 * Returns the private ip address of the internal communication network.
 * These IPs are part of the 10.0.2.0/24 subnet.
 * 
 * @param {String} machine_name 
 * @param {Object} instances the machine meta json instances object
 */
function getInternalIP(machine_name, instances) {
    const network_interfaces = getInstance(machine_name, instances).network_interfaces

    for (const network_interface of network_interfaces) {
        const ip = network_interface.private_ip_address
        if (ip.startsWith("10.0.2.")) {
            return ip
        }
    }
}

/**
 * Returns the public ip address of the management communication network.
 * 
 * @param {String} machine_name 
 * @param {Object} instances the machine meta json instances object
 */
function getPublicIP(machine_name, instances) {
    const instance = getInstance(machine_name, instances)
    return instance.public_dns_name
}

//*************************************
// Hosts file helper
//*************************************

/**
 * Returns a helper object needed to create the ansible hosts file.
 * 
 * @param {Object} machineMeta the machine meta json object
 */
function getHostsDataObject(machineMeta) {
    return {
        "machines:children": machineMeta.instances.map(i => {return i.tags.Name}).join("\n"),
        "machineGroups": machineMeta.instances.map(i => {return `[${i.tags.Name}]\n${i.public_dns_name} machine_name=${i.tags.Name}`}).join("\n\n")
    }
}

module.exports = function(fileLocation) {
    if (!fileLocation) {
        fileLocation = conf.runDir + "machine_meta.json"
    }

    const machineMetaJson = fs.readFileSync(fileLocation, "utf-8")
    const machineMeta = JSON.parse(stripJson(machineMetaJson))

    return {
        machineMeta: machineMeta,
        getInternalIP: function(machine_name) {
            return getInternalIP(machine_name, machineMeta.instances)
        },
        getPublicIP: function(machine_name) {
            return getPublicIP(machine_name, machineMeta.instances)
        },
        hostsDataObject: getHostsDataObject(machineMeta)
    }
}
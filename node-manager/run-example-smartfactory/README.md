# Smart Factory Example

This directory contains the user-provided configuration files and by MockFog generated files when running an experiment with [this](https://github.com/OpenFogStack/smart-factory-fog-example/tree/mockfog2) smart factory applicationg.
**Only** the files available in the *./config* directory need to be provided by the user.

The other files/folder are created by MockFog throghout the experiment:
- *appdata* contains data related to application containers and application output that MockFog collected
- *machines* contains meta data on individual machines such as available resources
- *hosts* is an [ansible hosts file](https://docs.ansible.com/ansible/2.3/intro_inventory.html) that MockFog creates to remember all created machines
- *vars* contains ansible var files that MockFog generates based on the user configuration

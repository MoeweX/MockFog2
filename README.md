# MockFog2

This project is part of MockFog which includes the following subprojects:
* [MockFog2](https://github.com/MoeweX/MockFog2/) New and more powerful version of MockFog (under active development)
* [MockFog-Meta](https://github.com/OpenFogStack/MockFog-Meta) Meta repository with a presentation and a demo video
* [MockFog-IaC](https://github.com/OpenFogStack/MockFog-IaC) MockFog Infrastructure as Code artifacts
* [MockFog-NodeManager](https://github.com/OpenFogStack/MockFog-NodeManager) MockFog Node Manager
* [MockFog-Agent](https://github.com/OpenFogStack/MockFog-Agent) MockFog Agent
* [MockFogLight](https://github.com/OpenFogStack/MockFogLight) A lightweight version of MockFog without a visual interface

Fog computing is an emerging computing paradigm that uses processing and storage capabilities located at the edge, in the cloud, and possibly in between. Testing fog applications, however, is hard since runtime infrastructures will typically be in use or may not exist, yet.

MockFog2 is a tool that can be used to emulate such infrastructures in the cloud. Developers can freely design emulated fog infrastructures and configure (or manipulate during runtime) performance characteristics. Furthermore, MockFog2 can manage to be evaluated applications and run pre-defined evaluation workloads.

If you use this software in a publication, please cite it as:

### Text
Jonathan Hasenburg, Martin Grambow, Elias Grünewald, Sascha Huk, David Bermbach. **MockFog: Emulating Fog Computing Infrastructure in the Cloud**. In: Proceedings of the First IEEE International Conference on Fog Computing 2019 (ICFC 2019). IEEE 2019.

### BibTeX
```
@inproceedings{hasenburg_mockfog:_2019,
	title = {{MockFog}: {Emulating} {Fog} {Computing} {Infrastructure} in the {Cloud}},
	booktitle = {Proceedings of the First {IEEE} {International} {Conference} on {Fog} {Computing} 2019 (ICFC 2019)},
	author = {Hasenburg, Jonathan and Grambow, Martin and Grunewald, Elias and Huk, Sascha and Bermbach, David},
	year = {2019},
	publisher = {IEEE}
}
```

A full list of our [publications](https://www.mcc.tu-berlin.de/menue/forschung/publikationen/parameter/en/) and [prototypes](https://www.mcc.tu-berlin.de/menue/forschung/prototypes/parameter/en/) is available on our group website.

## Project Overview

This project extends and builds upon prior versions of MockFog.
There are two major components:

#### Node Manager
The Node Manager is responsible for setting up required virtual machines in the Cloud and installing the node agent.
Setting up the infrastructure does also involve manipulating networking delays between machines.
The Node Manager is controlled through a node.js CLI application.

#### Node Agent
The Node Agent is capable of manipulating the network properties of its machine at runtime.
For this purpose, it offers a REST interface; this interface is fully documented with swagger.

## Quickstart using Gitpod
- Open the repository or an individual issue/PR in [Gitpod](https://www.gitpod.io/docs/getting-started/)
- Set the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables in your [Gitpod settings](https://www.gitpod.io/docs/environment-variables/)
- Copy and customize the infrastructure.jsonc file from the `node-manager/run-examples/config` directory to the `node-manager/run/config` directory
- You can now use MockFog2, bootstrap your infrastructure by running `node app.js bootstrap`

## Roadmap

For more information on the roadmap and related issues, see the [project overview](https://github.com/MoeweX/MockFog2/projects).

#### Version 1 (current version)
Supports the management of the infrastructure. Code is properly documented and node agent offers basic functionalities. The node manager can be controlled via cli.

#### Version 2
Supports the management of the application. This includes application roll-out, startup, shutdown, and the collection of results.

#### Version 3
Supports the orchestration of the infrastructure. For that, the node manager runs through pre-defined network manipulations and distributes them to the affected node agents at the appropriate time.

#### Version 4
Supports advanced functionality to improve the user experience and infrastructure manipulation capabilities.

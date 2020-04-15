# Implementation Notes

- It might not be required to set a private ip address when attaching the eni (there is a private ip count field in the examples)

Tagging
- Tags have this structure: <service>:mockfog:<purpose>, e.g., ec2:mockfog:machine_name
- The value of ec2:mockfog:machine_name is also assigned to „Name“ for easier display in the console


## Bootstrap Playbook

- Creates two subnets, one management and a private one.
- The management subnet is used for internet access and private/public dns ip -> mapped to eth0
- The private subnet has its own private ip (only accessible by machines in same subnet) -> mapped to eth1
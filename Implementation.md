# Implementation Notes

Tagging
- Tags have this structure: <service>:mockfog:<purpose>, e.g., ec2:mockfog:machine_name
- The value of ec2:mockfog:machine_name is also assigned to „Name“ for easier display in the console

## Bootstrap

- Creates two subnets, one management and a private one.
- The management subnet is used for internet access and private/public dns ip -> mapped to eth0
- The private subnet has its own private ip (only accessible by machines in same subnet) -> mapped to eth1

TODO/Check
- attaching enis again leads to failed playbook
- can var files be created if vars folder is missing?

## Destroy Playbook

- Destroy all resources related to the MockFog2 VPC, also deletes the key on AWS (but the local private key)
# Implementation Notes

- It might not be required to set a private ip address when attaching the eni (there is a private ip count field in the examples)

Tagging
- Tags have this structure: <service>:mockfog:<purpose>, e.g., ec2:mockfog:machine_name
- The value of ec2:mockfog:machine_name is also assigned to „Name“ for easier display in the console
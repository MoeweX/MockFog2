# Commands

Below, find useful commands when manually using these playbooks.
They have to be run in the node-manager directory of this repository.

```bash
ansible-playbook --ssh-common-args="-o StrictHostKeyChecking=no" playbooks/0101_bootstrap.yml --extra-vars="@run/vars/0101_bootstrap.yml" --step --start-at-task="Create SSH Key"
ansible-playbook --ssh-common-args="-o StrictHostKeyChecking=no" playbooks/0102_agent.yml -i "run/hosts" --key-file="run/ec2:mockfog2:ssh-key.pem" --extra-vars="@run/vars/0102_agent.yml" --step --start-at-task="Copy Agent"
ansible-playbook --ssh-common-args="-o StrictHostKeyChecking=no" playbooks/0104_destroy.yml --extra-vars="@run/vars/0104_destroy.yml" --step --start-at-task="Destroy Internet Gateway"
```

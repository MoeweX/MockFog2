# Commands

Below, find useful commands when manually using these playbooks.
They have to be run in the node-manager directory of this repository.

```bash
ansible-playbook --ssh-common-args="-o StrictHostKeyChecking=no" playbooks/02_bootstrap.yml --extra-vars="@run/vars/02_bootstrap.yml" --step --start-at-task="Create SSH Key"
ansible-playbook --ssh-common-args="-o StrictHostKeyChecking=no" playbooks/04_agent.yml -i "run/hosts" --key-file="run/ec2:mockfog2:ssh-key.pem" --extra-vars="@run/vars/04_agent.yml" --start-at-task="Copy Agent"
ansible-playbook --ssh-common-args="-o StrictHostKeyChecking=no" playbooks/07_destroy.yml --extra-vars="@run/vars/07_destroy.yml" --step --start-at-task="Destroy Internet Gateway"
```
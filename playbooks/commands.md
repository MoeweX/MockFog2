# Commands

Below, find useful commands when manually using these playbooks.
They have to be run in the root directory of the project.

```bash
ansible-playbook -i inventory/ec2.py --ssh-common-args="-o StrictHostKeyChecking=no" playbooks/02_bootstrap.yml --extra-vars="@run/vars/bootstrap.yml" --step --start-at-task="Create SSH Key"
```
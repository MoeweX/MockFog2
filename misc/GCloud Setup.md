# GCloud Code for Manual Setup

- for now, we also only use the pre-defined image types; even though custom cpu/memory combinations are possible
- GCloud does not need an SSH key, Ansible can log in via service account

```bash
# Configure defaults
gcloud config set project mockfog2
gcloud config set compute/zone europe-west1-c
gcloud config set compute/region europe-west1

# Create a network
gcloud compute networks create networks:mockfog2 \
    --subnet-mode custom

# Create management subnet
gcloud compute networks subnets create networks.subnet:mockfog2:management \
    --network vpc:mockfog2 \
    --range 10.0.1.0/24

# Create internal subnet
gcloud compute networks subnets create networks.subnet:mockfog2:internal \
    --network vpc:mockfog2 \
    --range 10.0.2.0/24

# Create public firewall (also tcp:agent_port & tcp:application_instruction_and_states_ports)
gcloud compute firewall-rules create firewall-rules:mockfog2:public \
    --allow tcp:22,tcp:,icmp \
    --source-ranges=0.0.0.0/0

# Create internal/management firewall
gcloud compute firewall-rules create firewall-rules:mockfog2:internal \
    --allow tcp \
    --source-ranges 10.0.1.0/24,10.0.2.0/24 \
    --priority 999

# Create VM1
gcloud compute instances create instances:mockfog2:vm1 \
    --machine-type=n1-standard-1 \
    --network-interface subnet=networks.subnet:mockfog2:management \
    --network-interface subnet=networks.subnet:mockfog2:internal \
    --metadata startup-script="#! /bin/bash
    sudo apt-get update
    sudo apt-get install apache2 -y
    sudo service apache2 restart
    echo '<!doctype html><html><body><h1>VM1</h1></body></html>' | tee /var/www/html/index.html"

# Create VM2
gcloud compute instances create instances:mockfog2:vm1 \
    --machine-type=n1-standard-1 \
    --network-interface subnet=networks.subnet:mockfog2:management \
    --network-interface subnet=networks.subnet:mockfog2:internal \
    --metadata startup-script="#! /bin/bash
    sudo apt-get update
    sudo apt-get install apache2 -y
    sudo service apache2 restart
    echo '<!doctype html><html><body><h1>VM1</h1></body></html>' | tee /var/www/html/index.html"
```

Things that must work:
-[ ] VMs can reach internet
-[ ] VMs can curl apache server via management subnet
-[ ] VMs can curl apache server via internal subnet
-[ ] I should not be able to curl apache server

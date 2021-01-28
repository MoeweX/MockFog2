# GCloud Code for Manual Setup

- for now, we also only use the pre-defined image types; even though custom cpu/memory combinations are possible
- GCloud does not need an SSH key, Ansible can log in via service account


```bash
# Configure defaults
gcloud config set project mockfog2
gcloud config set compute/zone europe-west1-c
gcloud config set compute/region europe-west1

####
# Create management network
gcloud compute networks create mf2-network-management \
    --subnet-mode custom

gcloud compute networks subnets create mf2-subnet-management \
    --network mf2-network-management \
    --range 10.0.1.0/24

# also add tcp:agent_port & tcp:application_instruction_and_states_ports)
gcloud compute firewall-rules create mf2-firewall-management\
    --network mf2-network-management \
    --allow tcp:22,icmp \
    --source-ranges=0.0.0.0/0

####
# Create internal network
gcloud compute networks create mf2-network-internal \
    --subnet-mode custom

gcloud compute networks subnets create mf2-subnet-internal \
    --network mf2-network-internal \
    --range 10.0.2.0/24

gcloud compute firewall-rules create mf2-firewall-internal \
    --network mf2-network-internal \
    --allow tcp,icmp \
    --source-ranges 10.0.2.0/24

# Create VM1
gcloud compute instances create mf2-vm1 \
    --machine-type=n1-standard-1 \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --network-interface subnet=mf2-subnet-management \
    --network-interface subnet=mf2-subnet-internal \
    --metadata startup-script="#! /bin/bash
    sudo apt-get update
    sudo apt-get install apache2 -y
    sudo service apache2 restart
    echo '<!doctype html><html><body><h1>VM1</h1></body></html>' | tee /var/www/html/index.html"

# Create VM2
gcloud compute instances create mf2-vm2 \
    --machine-type=n1-standard-1 \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --machine-type=n1-standard-1 \
    --network-interface subnet=mf2-subnet-management \
    --network-interface subnet=mf2-subnet-internal \
    --metadata startup-script="#! /bin/bash
    sudo apt-get update
    sudo apt-get install apache2 -y
    sudo service apache2 restart
    echo '<!doctype html><html><body><h1>VM2</h1></body></html>' | tee /var/www/html/index.html"
```

Things that must work:
-[x] VMs can reach internet
-[x] VMs can curl apache server via internal subnet (10.0.2.x)
-[x] VMs can not curl apache server via management subnet (10.0.1.x)
-[x] I should not be able to curl apache server

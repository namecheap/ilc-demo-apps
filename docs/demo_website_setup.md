# Demo website setup

## EC2 instance in AWS

* Launched manually
* In default VPC
* t3.small, 100Gb of Disk
* Has attached elastic IP (created manually) which is specified as A record for `demo.microfrontends.online`
* User data:
```yaml
#cloud-config
repo_update: true
repo_upgrade: security

ssh_authorized_keys:
 - ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDMP0yM7g6SSSEkw5n2odIIwFitC2Bu1VgDz7nNXPqwZjsJ9yw2ta98b1ZfLDWKABHZdwL/XExi9zDpcRY1GiZenFInZDV/9xIFbrts6HjuOeu22plkvlPDlBG5zNKCxaEX1wsi9xkD6250klGBNsuki5E9NbCPoduOrDlYcPiDsHkZe04nXN5ZGg2lEL2KxaoRdHRkATcqiQ96XSk/SZRInqriwnsB6Fu3rTdq5luQIGiwkMmYyvcXQ0m+hm9vUr0xPiI3dsGOCuFmhIOpk/E6Rx6kC8IO8Uq0ebbgxv/sobpdeRb2N5RNkQL65eBenlVy5a5Xy0bzNi9azA5tYUwH ilc-demo-apps@github.com

runcmd:
 - [ sh, -c, "amazon-linux-extras install -y docker" ]
 - service docker start
 - sudo systemctl enable httpd
 - [ sh, -c, "usermod -a -G docker ec2-user" ]
 - chkconfig docker on
 - [ sh, -c, 'curl -L https://github.com/docker/compose/releases/download/1.22.0/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose' ]
 - chmod +x /usr/local/bin/docker-compose
```

## "Deploy demo site" step in CI flow

* Uses SSH to connect to instance
* Performs start of the dem stand using Docker Compose
* Uses GitHub secret with SSH private key (public one you can see in user data above)
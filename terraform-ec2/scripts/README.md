# Docker Setup Script Documentation

## Overview
The `docker-setup.sh` script installs Docker and deploys the Skytrac Kafka UI application on Ubuntu 22.04 EC2 instances.

## Script Steps

### Step 1: Update System Packages
**Command:** `apt-get update && apt-get upgrade -y`
**Purpose:** Updates package lists and upgrades all installed packages to latest versions
**Details:** 
- `apt-get update` refreshes package repository information
- `apt-get upgrade -y` installs available upgrades without prompting

### Step 2: Install Docker
**Command:** `apt-get install -y docker.io`
**Purpose:** Installs Docker container runtime
**Details:**
- Uses Ubuntu's default Docker package
- Installs Docker Engine, CLI, and containerd
- `-y` flag auto-confirms installation

### Step 3: Start Docker Service
**Command:** `systemctl start docker && systemctl enable docker`
**Purpose:** Starts Docker daemon and enables automatic startup on boot
**Details:**
- `systemctl start docker` starts the Docker service immediately
- `systemctl enable docker` configures Docker to start on system boot

### Step 4: Pull Application Image
**Command:** `docker pull ${docker_image}:${docker_tag}`
**Purpose:** Downloads the Skytrac Docker image from registry
**Variables:**
- `${docker_image}` - Docker image name (default: "skytrac")
- `${docker_tag}` - Image tag/version (default: "latest")
**Example:** `docker pull skytrac:latest`

### Step 5: Run Application Container
**Command:** `docker run --name ${app_name} -d -p 80:80 --restart unless-stopped ${docker_image}:${docker_tag}`
**Purpose:** Starts the Skytrac application container
**Parameters:**
- `--name ${app_name}` - Container name (default: "skytrac")
- `-d` - Run in detached mode (background)
- `-p 80:80` - Map host port 80 to container port 80
- `--restart unless-stopped` - Auto-restart container unless manually stopped
- `${docker_image}:${docker_tag}` - Image to run
**Example:** `docker run --name skytrac -d -p 80:80 --restart unless-stopped skytrac:latest`

### Step 6: Add User to Docker Group
**Command:** `usermod -aG docker ubuntu`
**Purpose:** Allows ubuntu user to run Docker commands without sudo
**Details:**
- `-a` - Append to existing groups
- `-G docker` - Add to docker group
- `ubuntu` - Default Ubuntu user
**Result:** Can run `docker ps`, `docker logs` etc without sudo

## Variables

The script uses the following Terraform variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `docker_image` | `skytrac` | Docker image name |
| `docker_tag` | `latest` | Docker image tag/version |
| `app_name` | `skytrac` | Container name |

## Usage

### Terraform Integration
The script is automatically executed during EC2 instance creation via Terraform's `user_data`:

```hcl
user_data = templatefile("${path.module}/scripts/docker-setup.sh", {
  docker_image = var.docker_image
  docker_tag   = var.docker_tag
  app_name     = var.app_name
})
```

### Manual Execution
If needed, you can run the script manually on an EC2 instance:

```bash
# Make script executable
chmod +x docker-setup.sh

# Run with environment variables
export docker_image="skytrac"
export docker_tag="latest"
export app_name="skytrac"
./docker-setup.sh
```

## Troubleshooting

### Common Issues

1. **Docker installation fails**
   - Ensure Ubuntu 22.04 with internet access
   - Check if package repositories are accessible

2. **Container won't start**
   - Verify Docker image exists: `docker images`
   - Check Docker logs: `docker logs skytrac`

3. **Port 80 not accessible**
   - Check security groups allow HTTP traffic
   - Verify container is running: `docker ps`

4. **Permission denied**
   - Ensure user is in docker group: `groups ubuntu`
   - Re-login after group change

### Debug Commands

```bash
# Check Docker status
systemctl status docker

# View running containers
docker ps

# View container logs
docker logs skytrac

# Check Docker service
docker info
```

## Security Notes

- Script runs as root during instance initialization
- Docker socket access granted to ubuntu user
- Container runs with default Docker security settings
- Consider using specific image tags instead of `latest` for production

## File Structure

```
terraform/
├── scripts/
│   ├── docker-setup.sh    # Main script
│   └── README.md          # This documentation
├── main.tf                # Terraform configuration
├── variables.tf           # Variable definitions
└── outputs.tf             # Output definitions
```

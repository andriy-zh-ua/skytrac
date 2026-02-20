#!/bin/bash
set -e

echo "Updating system..."

# Update system
apt-get update
apt-get upgrade -y

echo "System updated successfully!"
echo "Installing Docker..."

# Install Docker
apt-get install -y docker.io
systemctl start docker
systemctl enable docker

echo "Docker installed successfully!"
echo "Installing Git..."

# Install git if not present
apt-get install -y git

echo "Git installed successfully!"
echo "Cloning Skytrac repository..."

# Clone the Skytrac repository using personal access token
cd /tmp
if [ -d "skytrac" ]; then
    rm -rf skytrac
fi

# Use GitHub personal access token (passed from Terraform)
if [ -z "${github_token}" ]; then
    echo "ERROR: GitHub token not provided"
    exit 1
fi

# Clone using personal access token
echo "Cloning repository with access token..."
git clone https://${github_token}@github.com/andriy-zh-ua/skytrac.git skytrac
cd skytrac

echo "Repository cloned successfully!"
echo "Building Docker image..."

# Build the Docker image
docker build -t ${docker_image}:${docker_tag} .

# Check if build was successful
if ! docker images ${docker_image}:${docker_tag} | grep -q "${docker_image}"; then
    echo "ERROR: Failed to build Docker image"
    exit 1
fi

echo "Successfully built ${docker_image}:${docker_tag}"

# Run the application
echo "Starting Skytrac container..."
docker run --name ${app_name} -d -p 80:80 --restart unless-stopped ${docker_image}:${docker_tag}

# Verify container is running
sleep 5
if ! docker ps | grep -q "${app_name}"; then
    echo "ERROR: Container failed to start"
    docker logs ${app_name}
    exit 1
fi

echo "Skytrac application deployed successfully!"

# Add user to docker group
usermod -aG docker ubuntu

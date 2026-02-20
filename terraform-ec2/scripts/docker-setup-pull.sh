#!/bin/bash
set -e

echo "🐳 Skytrac Docker Hub Pull Deployment"
echo "====================================="

# Update system
echo "📦 Step 1: Updating system..."
apt-get update
apt-get upgrade -y
echo "✅ System updated successfully!"

# Install Docker
echo "🐳 Step 2: Installing Docker..."
apt-get install -y docker.io
systemctl start docker
systemctl enable docker
echo "✅ Docker installed successfully!"

# Login to Docker Hub for private repository
echo "🔐 Step 3: Logging into Docker Hub for private repository..."

# Use Docker Hub credentials (passed from Terraform)
if [ -z "${docker_token}" ]; then
    echo "❌ ERROR: Docker token not provided"
    echo "❌ Add docker_token variable to terraform.tfvars"
    exit 1
fi

# Login to Docker Hub
echo "${docker_token}" | docker login -u semenyukandriyv --password-stdin
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to login to Docker Hub"
    exit 1
fi

echo "✅ Successfully logged into Docker Hub!"

# Pull and run the application from Docker Hub
echo "📥 Step 4: Pulling ${docker_image}:${docker_tag} from Docker Hub..."

# Pull the Docker image
docker pull ${docker_image}:${docker_tag}

# Check if pull was successful
if ! docker images ${docker_image}:${docker_tag} | grep -q "${docker_image}"; then
    echo "❌ ERROR: Failed to pull Docker image from Docker Hub"
    echo "❌ Make sure the image exists: ${docker_image}:${docker_tag}"
    echo "❌ Check: https://hub.docker.com/r/semenyukandriyv/skytrac"
    exit 1
fi

echo "✅ Successfully pulled ${docker_image}:${docker_tag}"

# Run the application
echo "🚀 Step 5: Starting Skytrac container..."
docker run --name ${app_name} -d -p 80:80 --restart unless-stopped ${docker_image}:${docker_tag}

# Verify container is running
sleep 5
if ! docker ps | grep -q "${app_name}"; then
    echo "❌ ERROR: Container failed to start"
    echo "❌ Container logs:"
    docker logs ${app_name}
    exit 1
fi

echo "✅ Skytrac container started successfully!"

# Add user to docker group
echo "👤 Step 6: Adding user to docker group..."
usermod -aG docker ubuntu
echo "✅ User added to docker group!"

# Final verification
echo "🔍 Step 7: Final verification..."
echo "Running containers:"
docker ps
echo ""
echo "Docker images:"
docker images | grep ${docker_image}
echo ""
echo "🎉 Skytrac application deployed successfully!"
echo "🚀 Container name: ${app_name}"
echo "🐳 Image: ${docker_image}:${docker_tag}"

# Skytrac Kafka UI - Terraform AWS Deployment

Deploy the Skytrac Kafka UI application to AWS using Terraform. This setup creates a complete infrastructure including VPC, networking, security groups, and an EC2 instance running the Docker container.

## 🏗️ Architecture Overview

```
Internet
    ↓
Internet Gateway
    ↓
Public Subnet (10.0.1.0/24)
    ↓
EC2 Instance (Ubuntu 22.04 LTS)
    ↓
Docker Container (Skytrac Kafka UI)
```

## 📁 Project Structure

```
terraform/
├── main.tf              # Main infrastructure resources
├── variables.tf          # Variable definitions
├── outputs.tf            # Output definitions
├── versions.tf           # Terraform and provider versions
├── provider.tf           # AWS provider configuration
├── terraform.tfvars      # Variable values (your configuration)
├── scripts/
│   ├── docker-setup.sh   # EC2 instance setup script
│   └── README.md          # Script documentation
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [AWS Account](https://aws.amazon.com/) with appropriate permissions
- [Docker](https://www.docker.com/) (for local testing)
- SSH key pair (for EC2 access)

### 1. Configure Variables

Edit `terraform.tfvars` with your configuration:

```hcl
# AWS Region
aws_region = "us-east-2"

# AWS EC2 instance type
instance_type = "t3.micro"

# AWS AMI ID (Ubuntu 22.04 LTS x86)
ami_id = "ami-06e3c045d79fd65d9"

# Application Name
app_name = "skytrac"

# Docker Configuration
docker_image = "skytrac"
docker_tag = "latest"

# AWS Credentials (configure securely)
aws_access_key_id     = "YOUR_ACCESS_KEY_ID"
aws_secret_access_key = "YOUR_SECRET_ACCESS_KEY"

# SSH Configuration (replace with your public key)
public_key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPopIfimlcBlhD05BRT/WLIvUEkV+A1Ar915Vw/Sa9OJ user@hostname"
```

**⚠️ Important Security Notes:**
- Never commit actual AWS credentials to version control
- Use environment variables or AWS profiles for production
- Replace placeholder values with your actual credentials
- Generate your own SSH key pair using `ssh-keygen`

### Secure Credential Setup

#### Option 1: Environment Variables (Recommended)
```bash
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
export AWS_DEFAULT_REGION="us-east-2"
```

#### Option 2: AWS CLI Profile
```bash
aws configure --profile skytrac
# Enter your credentials when prompted
```

#### Option 3: Generate SSH Key
```bash
# Generate new SSH key pair
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to terraform.tfvars
cat ~/.ssh/id_ed25519.pub
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Validate Configuration

```bash
terraform validate
```

### 4. Plan Deployment

```bash
terraform plan
```

### 5. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

## 📋 Infrastructure Components

### AWS Resources Created

| Resource | Purpose | Configuration |
|----------|---------|---------------|
| **VPC** | Network isolation | `10.0.0.0/16` |
| **Internet Gateway** | Internet access | Public connectivity |
| **Public Subnet** | EC2 instance placement | `10.0.1.0/24` |
| **Route Table** | Network routing | Internet route |
| **Security Groups** | Traffic control | SSH, HTTP, HTTPS |
| **EC2 Instance** | Application server | Ubuntu 22.04 LTS |
| **SSH Key Pair** | Secure access | Your public key |

### 🧮 CIDR Block Mathematics

This configuration uses the `cidrsubnet()` function to automatically calculate subnet CIDR blocks. Here's how it works:

#### VPC CIDR Block

📌 **Understanding /16 CIDR Mask**

```
Mask in binary:
11111111.11111111.00000000.00000000
```

**That means:**
```
|---- NETWORK ----|------ HOST ------|
| 16 bits         | 16 bits          |
```

**So:**
```
00001010.00000000 | 00000000.00000000
   network bits        host bits
```

**VPC CIDR: 10.0.0.0/16**
```
Binary: 00001010.00000000.00000000.00000000
                |--- Host bits ---|
```

**What /16 Means:**
- **Network portion**: First 16 bits (10.0) are fixed
- **Host portion**: Last 16 bits (0.0) can vary
- **Total addresses**: 2^16 = 65,536 IP addresses
- **Usable addresses**: 65,534 (minus network and broadcast)

#### Subnet Calculation with newbits = 8

🚀 **Now We Subnet to /24**

When you said:
```
New subnet mask: /24 (16 + 8 = 24)
```

**That means:**
```
We take 8 bits from the host part
And convert them into subnet bits
```

**So new mask:**
```
11111111.11111111.11111111.00000000
```

**In decimal:**
```
255.255.255.0
```

**What /24 Means:**
- **Network portion**: First 24 bits (10.0.0) are fixed
- **Host portion**: Last 8 bits (0) can vary
- **Total addresses**: 2^8 = 256 IP addresses
- **Usable addresses**: 254 (minus network and broadcast)

**Binary representation:**

🔎 **Binary Layout for /24**
```
00001010.00000000.00000000.00000000
```

**Now divide it like this:**
```
|--- Network ---|--- Subnet ---|--- Host ---|
| 16 bits       | 8 bits       | 8 bits     |
```

**Visually:**
```
00001010.00000000.00000000.00000000
<---16 bits----><-8-><-8->
```

**What this means:**
- **Network bits (16)**: `00001010.00000000` = 10.0 (fixed for VPC)
- **Subnet bits (8)**: `00000000` = 0 (varies per subnet)
- **Host bits (8)**: `00000000` = 0 (varies per host in subnet)

**How subnets are created:**
```
Subnet 0: 00001010.00000000.00000000.00000000 = 10.0.0.0/24
Subnet 1: 00001010.00000000.00000001.00000000 = 10.0.1.0/24
Subnet 2: 00001010.00000000.00000010.00000000 = 10.0.2.0/24
Subnet 3: 00001010.00000000.00000011.00000000 = 10.0.3.0/24
```

**How hosts are created within each subnet:**
```
Subnet 0 Host 1: 00001010.00000000.00000000.00000001 = 10.0.0.1/24
Subnet 0 Host 2: 00001010.00000000.00000000.00000010 = 10.0.0.2/24
...
Subnet 0 Host 254: 00001010.00000000.00000000.11111110 = 10.0.0.254/24
```

#### Resulting Subnets
```
count.index = 0: 10.0.0.0/24   (00000000)
count.index = 1: 10.0.1.0/24   (00000001)
count.index = 2: 10.0.2.0/24   (00000010)
count.index = 3: 10.0.3.0/24   (00000011)
```

#### How Terraform Uses This
```hcl
# In public_subnet.tf:
cidr_block = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)

# This automatically creates:
- count.index = 0: 10.0.0.0/24 (first subnet)
- count.index = 1: 10.0.1.0/24 (second subnet)
- count.index = 2: 10.0.2.0/24 (third subnet)
# And so on...
```

#### Benefits of This Approach
- **Automatic calculation** - No manual CIDR math required
- **No overlaps** - Terraform guarantees non-overlapping subnets
- **Scalable** - Add more subnets by just increasing the list
- **Consistent** - All subnets are the same size (/24 = 256 IPs each)

#### Example Configuration
```hcl
# terraform.tfvars
public_subnet_cidrs = ["10.0.1.0/24"]  # One subnet

# Automatically creates:
# Subnet 0: 10.0.0.0/24 (256 IP addresses)

# If you add more:
public_subnet_cidrs = [
  "10.0.1.0/24",  # Creates 10.0.0.0/24
  "10.0.2.0/24",  # Creates 10.0.1.0/24  
  "10.0.3.0/24"   # Creates 10.0.2.0/24
]
```

### Security Groups

- **SSH Security Group**: Port 22 from anywhere (0.0.0.0/0)
- **HTTP Security Group**: Port 80 from anywhere (0.0.0.0/0)
- **HTTPS Security Group**: Port 443 from anywhere (0.0.0.0/0)

## � Cost Estimation

### Monthly Costs (us-east-2)

| Resource | Cost | Notes |
|----------|------|-------|
| **EC2 t3.micro** | ~$5/month | 750 hours/month |
| **Data Transfer** | ~$1-5/month | Depends on traffic |
| **Total** | ~$6-10/month | Estimate |

### Cost Optimization

- Use `t3.nano` for lower cost (~$3/month)
- Stop instance when not in use
- Monitor data transfer costs

## � Accessing Your Application

After deployment, get the access information:

```bash
# View all outputs
terraform output

# Get specific information
terraform output instance_url
terraform output ssh_command
```

### Example Outputs

```bash
instance_public_ip = "52.15.123.45"
instance_url = "http://52.15.123.45"
ssh_command = "ssh -i skytrac-aws-key.pem ubuntu@52.15.123.45"
```

### Access the Application

Open your browser and navigate to:
```
http://<public-ip>
```

### SSH Access

```bash
# Using the generated SSH command
ssh -i skytrac-aws-key.pem ubuntu@<public-ip>

# Or manually
ssh -i ~/.ssh/your_key.pem ubuntu@<public-ip>
```

## 🔧 Configuration Options

### Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS deployment region | `us-east-2` |
| `instance_type` | EC2 instance type | `t3.micro` |
| `ami_id` | Ubuntu 22.04 LTS AMI | `ami-06e3c045d79fd65d9` |
| `app_name` | Application name | `skytrac` |
| `docker_image` | Docker image name | `skytrac` |
| `docker_tag` | Docker image tag | `latest` |
| `vpc_cidr` | VPC CIDR block | `10.0.0.0/16` |
| `subnet_cidr` | Subnet CIDR block | `10.0.1.0/24` |

### Customization Examples

#### Change Instance Type
```hcl
# terraform.tfvars
instance_type = "t3.small"  # More powerful instance
```

#### Use Different Docker Image
```hcl
# terraform.tfvars
docker_image = "yourusername/skytrac"
docker_tag = "v1.0.0"
```

#### Deploy in Different Region
```hcl
# terraform.tfvars
aws_region = "us-west-2"
ami_id = "ami-0c02fb55956c7d316"  # Update AMI for region
```

## 🐳 Docker Setup Script

The `scripts/docker-setup.sh` script automatically:

1. **Updates System Packages**
   ```bash
   apt-get update && apt-get upgrade -y
   ```

2. **Installs Docker**
   ```bash
   apt-get install -y docker.io
   systemctl start docker
   systemctl enable docker
   ```

3. **Deploys Application**
   ```bash
   docker pull skytrac:latest
   docker run --name skytrac -d -p 80:80 --restart unless-stopped skytrac:latest
   ```

4. **Configures User Access**
   ```bash
   usermod -aG docker ubuntu
   ```

## � Monitoring and Debugging

### Check Instance Status

```bash
# SSH into the instance
ssh -i skytrac-aws-key.pem ubuntu@<public-ip>

# Check Docker container status
docker ps

# View container logs
docker logs skytrac

# Check system status
systemctl status docker
```

### Common Issues

#### Container Not Running
```bash
# Check if container exists
docker ps -a

# Restart container
docker start skytrac

# View logs for errors
docker logs skytrac
```

#### Network Issues
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>

# Check route tables
aws ec2 describe-route-tables --route-table-ids <rt-id>
```

## 🔄 Updating the Application

### Method 1: Update Docker Image
```bash
# SSH into instance
ssh -i skytrac-aws-key.pem ubuntu@<public-ip>

# Pull new image
docker pull skytrac:new-version

# Stop old container
docker stop skytrac
docker rm skytrac

# Run new container
docker run --name skytrac -d -p 80:80 --restart unless-stopped skytrac:new-version
```

### Method 2: Update Terraform Variables
```bash
# Update terraform.tfvars
docker_tag = "new-version"

# Re-apply configuration
terraform apply
```

## 🗑️ Cleanup

To destroy all created resources:

```bash
terraform destroy
```

Type `yes` when prompted to confirm deletion.

**⚠️ Warning:** This will delete all resources including the EC2 instance and your application data.

## � Security Considerations

### SSH Access
- SSH keys are used for authentication (no passwords)
- SSH is restricted to your public key
- Consider limiting SSH to specific IP addresses in production

### Network Security
- Security groups restrict traffic to necessary ports only
- VPC provides network isolation
- No sensitive data in user data scripts

### AWS Credentials
- Never commit AWS credentials to version control
- Use environment variables or AWS profiles for production
- Consider using AWS IAM roles for EC2 instances

## �️ Troubleshooting

### Common Terraform Issues

#### Initialization Failed
```bash
# Clean and reinitialize
rm -rf .terraform
terraform init
```

#### State Lock Issues
```bash
# Force unlock (be careful!)
terraform force-unlock LOCK_ID
```

#### Resource Creation Failed
```bash
# Check resource status
terraform plan

# Recreate failed resource
terraform taint RESOURCE_TYPE.RESOURCE_NAME
terraform apply
```

### Common AWS Issues

#### Instance Not Accessible
1. Check security group rules
2. Verify subnet has public IP assignment
3. Check internet gateway configuration
4. Verify route table associations

#### Docker Issues
1. Check Docker service status
2. Verify image pull success
3. Check container logs
4. Verify port mapping

## 📚 Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/)
- [Docker Documentation](https://docs.docker.com/)
- [Ubuntu 22.04 LTS Documentation](https://ubuntu.com/22.04/)

---

**Happy Terraforming! 🚀**

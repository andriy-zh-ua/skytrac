# AWS Region
variable "aws_region" {
  description = "AWS region"
  type        = string
}

# AWS EC2 instance type
variable "instance_type" {
  description = "AWS EC2 instance type"
  type        = string
}

# AWS AMI ID
variable "ami_id" {
  description = "AMI ID for the EC2 instance"
  type        = string
}

# Application Name
variable "app_name" {
  description = "Application name"
  type        = string
}

# Docker Configuration
variable "docker_image" {
  description = "Docker image name"
  type        = string
}

variable "docker_tag" {
  description = "Docker image tag"
  type        = string
}

# AWS Credentials
variable "aws_access_key_id" {
  description = "AWS access key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS secret access key"
  type        = string
  sensitive   = true
}

# SSH Configuration
variable "public_key" {
  description = "SSH public key for access"
  type        = string
  sensitive   = true
}

# GitHub Personal Access Token
variable "github_token" {
  description = "GitHub personal access token for private repository access"
  type        = string
  sensitive   = true
}

# Docker Hub Personal Access Token
variable "docker_token" {
  description = "Docker Hub personal access token for private repository access"
  type        = string
  sensitive   = true
}

# VPC Configuration - The entire network infrastructure (like a city)
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

# Public Subnet Configuration - A specific network segment within the VPC (like a neighborhood in a city)
variable "public_subnet_cidrs" {
  description = "CIDR block for public subnet"
  type        = list(string)
}

# Private Subnet Configuration - A specific network segment within the VPC (like a neighborhood in a city)
variable "private_subnet_cidrs" {
  description = "CIDR block for private subnet"
  type        = list(string)
}

# IPv4 CIDR block for all traffic (inbound + outbound)
variable "ipv4_cidr" {
  description = "IPv4 CIDR block for security group rules"
  type        = string
}

# IPv6 CIDR block for all traffic (inbound + outbound)
variable "ipv6_cidr" {
  description = "IPv6 CIDR block for security group rules"
  type        = string
}




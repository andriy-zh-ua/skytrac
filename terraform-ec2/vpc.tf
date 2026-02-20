# VPC - Virtual Private Cloud (Our private network in AWS)
resource "aws_vpc" "main" {
  cidr_block         = var.vpc_cidr
  enable_dns_support = true # This allows AWS to assign a public DNS name

  tags = {
    Name = "${var.app_name}-vpc"
  }
}

# Internet Gateway - Provides internet access to our VPC
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.app_name}-igw"
  }
}
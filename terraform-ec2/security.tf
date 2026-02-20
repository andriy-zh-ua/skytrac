# SSH Security Group - Allows remote access to EC2 instances
resource "aws_security_group" "skytrac_sg_ssh" {
  name        = "${var.app_name}-sg-ssh"
  description = "Allow SSH traffic from anywhere"
  vpc_id      = aws_vpc.main.id

  # Inbound rule: Allow SSH (port 22) from any IP
  ingress {
    description      = "SSH from anywhere"
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = [var.ipv4_cidr]
    ipv6_cidr_blocks = [var.ipv6_cidr]
  }

  # Outbound rule: Allow all outbound traffic
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = [var.ipv4_cidr]
    ipv6_cidr_blocks = [var.ipv6_cidr]
  }

  tags = {
    Name = "${var.app_name}-sg-ssh"
  }
}

# HTTP Security Group - Allows web traffic to the application
resource "aws_security_group" "skytrac_sg_http" {
  name        = "${var.app_name}-sg-http"
  description = "Allow HTTP traffic from anywhere"
  vpc_id      = aws_vpc.main.id

  # Inbound rule: Allow HTTP (port 80) from any IP
  ingress {
    description      = "HTTP from anywhere"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = [var.ipv4_cidr]
    ipv6_cidr_blocks = [var.ipv6_cidr]
  }

  # Outbound rule: Allow all outbound traffic
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = [var.ipv4_cidr]
    ipv6_cidr_blocks = [var.ipv6_cidr]
  }

  tags = {
    Name = "${var.app_name}-sg-http"
  }
}

# HTTPS Security Group - Allows secure web traffic to the application
resource "aws_security_group" "skytrac_sg_https" {
  name        = "${var.app_name}-sg-https"
  description = "Allow HTTPS traffic from anywhere"
  vpc_id      = aws_vpc.main.id

  # Inbound rule: Allow HTTPS (port 443) from any IP
  ingress {
    description      = "HTTPS from anywhere"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = [var.ipv4_cidr]
    ipv6_cidr_blocks = [var.ipv6_cidr]
  }

  # Outbound rule: Allow all outbound traffic
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = [var.ipv4_cidr]
    ipv6_cidr_blocks = [var.ipv6_cidr]
  }

  tags = {
    Name = "${var.app_name}-sg-https"
  }
}

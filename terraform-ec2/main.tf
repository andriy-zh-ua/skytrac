
# SSH Key Pair
resource "aws_key_pair" "ssh_key" {
  key_name   = "${var.app_name}-ssh-key" # Unique key name for the EC2 instance
  public_key = file(var.public_key)      # Read public key from file
}

# EC2 Instance
resource "aws_instance" "skytrac" {
  ami           = var.ami_id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.public[0].id       # EC2 instance can only be in ONE subnet (we use the first one)
  key_name      = aws_key_pair.ssh_key.key_name # Optional, if you want to connect via SSH

  vpc_security_group_ids = [
    aws_security_group.skytrac_sg_ssh.id,
    aws_security_group.skytrac_sg_https.id,
    aws_security_group.skytrac_sg_http.id
  ]

  user_data = templatefile("${path.module}/scripts/docker-setup-pull.sh", {
    docker_image = var.docker_image
    docker_tag   = var.docker_tag
    app_name     = var.app_name
    docker_token = var.docker_token
  })

  tags = {
    Name = "${var.app_name}-ec2-instance"
  }
}



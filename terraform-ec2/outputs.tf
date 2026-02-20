output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.skytrac.public_ip
}

output "instance_url" {
  description = "URL to access the application"
  value       = "http://${aws_instance.skytrac.public_ip}"
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ${aws_key_pair.ssh_key.key_name}.pem ubuntu@${aws_instance.skytrac.public_ip}"
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "subnet_ids" {
  description = "IDs of all public subnets"
  value       = aws_subnet.public[*].id
}

output "first_subnet_id" {
  description = "ID of the first public subnet"
  value       = aws_subnet.public[0].id
}

output "security_group_ids" {
  description = "IDs of all security groups"
  value = [
    aws_security_group.skytrac_sg_ssh.id,
    aws_security_group.skytrac_sg_https.id,
    aws_security_group.skytrac_sg_http.id
  ]
}

output "ssh_security_group_id" {
  description = "ID of the SSH security group"
  value       = aws_security_group.skytrac_sg_ssh.id
}

output "http_security_group_id" {
  description = "ID of the HTTP security group"
  value       = aws_security_group.skytrac_sg_http.id
}

output "https_security_group_id" {
  description = "ID of the HTTPS security group"
  value       = aws_security_group.skytrac_sg_https.id
}

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.skytrac.id
}

output "instance_arn" {
  description = "ARN of the EC2 instance"
  value       = aws_instance.skytrac.arn
}

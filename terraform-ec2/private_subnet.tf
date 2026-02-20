# Private Subnets - Network segments for internal resources (databases, etc.)
#
# To ensure:
# - Private subnets start AFTER public subnets
# - No CIDR overlap occurs
# - Subnet allocation remains dynamic and scalable
resource "aws_subnet" "private" {
  count                   = length(var.private_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + length(var.public_subnet_cidrs)) # 256 IP addresses per subnet
  availability_zone       = data.aws_availability_zones.available.names[count.index]                              # Use available zones
  map_public_ip_on_launch = false                                                                                 # No public internet access

  tags = {
    Name = "${var.app_name}-private-subnet-${count.index + 1}"
  }
}

# Route Table for Private Subnets - No internet route (or NAT gateway)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  # No internet route for private subnets
  # Add NAT gateway route if needed:
  # route {
  #   cidr_block     = "0.0.0.0/0"
  #   nat_gateway_id = aws_nat_gateway.main.id
  # }

  tags = {
    Name = "${var.app_name}-private-route-table"
  }
}

# Route Table Association for Private Subnets
resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

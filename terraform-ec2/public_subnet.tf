# Public Subnets - Network segments where EC2 instances will be deployed
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)      # 256 IP addresses per subnet
  availability_zone       = data.aws_availability_zones.available.names[count.index] # Use available zones
  map_public_ip_on_launch = true                                                     # Public internet access for instances

  tags = {
    Name = "${var.app_name}-public-subnet-${count.index + 1}"
  }
}

# Route Table for Public Subnets - Routes internet traffic to Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "${var.app_name}-public-route-table"
  }
}

# Route Table Association for Public Subnets
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}
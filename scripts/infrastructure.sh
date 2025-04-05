#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
S3_BUCKET="bleujs-deployments"
APP_NAME="bleujs"
ENV_NAME="bleujs-prod"
REGION="us-east-1"
PLATFORM="Python 3.12"
DB_INSTANCE="bleujs-db"
DB_NAME="bleujs"
DB_USER="bleujs_admin"
DB_PASSWORD=$(openssl rand -base64 32)  # Generate a secure random password
VPC_CIDR="10.0.0.0/16"
PUBLIC_SUBNET_1_CIDR="10.0.1.0/24"
PUBLIC_SUBNET_2_CIDR="10.0.2.0/24"

echo -e "${YELLOW}Starting AWS infrastructure setup...${NC}"

# Check AWS CLI installation
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}AWS credentials are not configured. Please configure them first.${NC}"
    exit 1
fi

# Create VPC
echo -e "${YELLOW}Creating VPC...${NC}"
VPC_ID=$(aws ec2 create-vpc \
    --cidr-block "${VPC_CIDR}" \
    --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${APP_NAME}-vpc}]" \
    --query 'Vpc.VpcId' \
    --output text)

# Enable DNS hostnames and DNS support
aws ec2 modify-vpc-attribute \
    --vpc-id "${VPC_ID}" \
    --enable-dns-hostnames
aws ec2 modify-vpc-attribute \
    --vpc-id "${VPC_ID}" \
    --enable-dns-support

# Create Internet Gateway
echo -e "${YELLOW}Creating Internet Gateway...${NC}"
IGW_ID=$(aws ec2 create-internet-gateway \
    --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${APP_NAME}-igw}]" \
    --query 'InternetGateway.InternetGatewayId' \
    --output text)

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway \
    --vpc-id "${VPC_ID}" \
    --internet-gateway-id "${IGW_ID}"

# Create public subnets
echo -e "${YELLOW}Creating public subnets...${NC}"
SUBNET_1_ID=$(aws ec2 create-subnet \
    --vpc-id "${VPC_ID}" \
    --cidr-block "${PUBLIC_SUBNET_1_CIDR}" \
    --availability-zone "${REGION}a" \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${APP_NAME}-public-1}]" \
    --query 'Subnet.SubnetId' \
    --output text)

SUBNET_2_ID=$(aws ec2 create-subnet \
    --vpc-id "${VPC_ID}" \
    --cidr-block "${PUBLIC_SUBNET_2_CIDR}" \
    --availability-zone "${REGION}b" \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${APP_NAME}-public-2}]" \
    --query 'Subnet.SubnetId' \
    --output text)

# Create route table
echo -e "${YELLOW}Creating route table...${NC}"
ROUTE_TABLE_ID=$(aws ec2 create-route-table \
    --vpc-id "${VPC_ID}" \
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${APP_NAME}-rt}]" \
    --query 'RouteTable.RouteTableId' \
    --output text)

# Add route to Internet Gateway
aws ec2 create-route \
    --route-table-id "${ROUTE_TABLE_ID}" \
    --destination-cidr-block "0.0.0.0/0" \
    --gateway-id "${IGW_ID}"

# Associate route table with subnets
aws ec2 associate-route-table \
    --route-table-id "${ROUTE_TABLE_ID}" \
    --subnet-id "${SUBNET_1_ID}"
aws ec2 associate-route-table \
    --route-table-id "${ROUTE_TABLE_ID}" \
    --subnet-id "${SUBNET_2_ID}"

# Create security group
echo -e "${YELLOW}Creating security group...${NC}"
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name "${APP_NAME}-sg" \
    --description "Security group for ${APP_NAME}" \
    --vpc-id "${VPC_ID}" \
    --query 'GroupId' \
    --output text)

# Configure security group rules
aws ec2 authorize-security-group-ingress \
    --group-id "${SECURITY_GROUP_ID}" \
    --protocol tcp \
    --port 22 \
    --cidr "0.0.0.0/0"  # SSH access
aws ec2 authorize-security-group-ingress \
    --group-id "${SECURITY_GROUP_ID}" \
    --protocol tcp \
    --port 80 \
    --cidr "0.0.0.0/0"  # HTTP access
aws ec2 authorize-security-group-ingress \
    --group-id "${SECURITY_GROUP_ID}" \
    --protocol tcp \
    --port 443 \
    --cidr "0.0.0.0/0"  # HTTPS access

# Create RDS instance
echo -e "${YELLOW}Creating RDS instance...${NC}"
aws rds create-db-instance \
    --db-instance-identifier "${DB_INSTANCE}" \
    --db-name "${DB_NAME}" \
    --master-username "${DB_USER}" \
    --master-user-password "${DB_PASSWORD}" \
    --db-instance-class "db.t3.micro" \
    --engine "postgres" \
    --allocated-storage 20 \
    --vpc-security-group-ids "${SECURITY_GROUP_ID}" \
    --db-subnet-group-name "${APP_NAME}-subnet-group" \
    --backup-retention-period 7 \
    --no-publicly-accessible

# Create S3 bucket
echo -e "${YELLOW}Creating S3 bucket...${NC}"
aws s3 mb "s3://${S3_BUCKET}" --region "${REGION}"
aws s3api put-bucket-versioning --bucket "${S3_BUCKET}" --versioning-configuration Status=Enabled

# Create Elastic Beanstalk application
echo -e "${YELLOW}Creating Elastic Beanstalk application...${NC}"
aws elasticbeanstalk create-application --application-name "${APP_NAME}"

# Create environment configuration
cat > .ebextensions/01_environment.config << EOF
option_settings:
  aws:elasticbeanstalk:application:environment:
    PYTHONPATH: "/var/app/current"
    DJANGO_SETTINGS_MODULE: "bleujs.settings"
    ALLOWED_HOSTS: ".elasticbeanstalk.com"
    DEBUG: "False"
    DATABASE_URL: "postgres://${DB_USER}:${DB_PASSWORD}@${DB_INSTANCE}.${REGION}.rds.amazonaws.com:5432/${DB_NAME}"
EOF

# Create Elastic Beanstalk environment
echo -e "${YELLOW}Creating Elastic Beanstalk environment...${NC}"
aws elasticbeanstalk create-environment \
    --application-name "${APP_NAME}" \
    --environment-name "${ENV_NAME}" \
    --platform-version "${PLATFORM}" \
    --option-settings file://.ebextensions/01_environment.config \
    --tier Name=WebServer,Type=Standard,Version="1.0" \
    --version-label "initial"

# Save infrastructure details
echo -e "${YELLOW}Saving infrastructure details...${NC}"
cat > infrastructure-details.txt << EOF
VPC_ID: ${VPC_ID}
SUBNET_1_ID: ${SUBNET_1_ID}
SUBNET_2_ID: ${SUBNET_2_ID}
SECURITY_GROUP_ID: ${SECURITY_GROUP_ID}
DB_INSTANCE: ${DB_INSTANCE}
DB_NAME: ${DB_NAME}
DB_USER: ${DB_USER}
DB_PASSWORD: ${DB_PASSWORD}
S3_BUCKET: ${S3_BUCKET}
APP_NAME: ${APP_NAME}
ENV_NAME: ${ENV_NAME}
EOF

echo -e "${GREEN}AWS infrastructure setup completed successfully!${NC}"
echo -e "${YELLOW}Infrastructure details have been saved to infrastructure-details.txt${NC}"
echo -e "${YELLOW}Please keep these details secure and do not commit them to version control.${NC}"

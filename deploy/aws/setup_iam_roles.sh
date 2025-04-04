#!/bin/bash

# Exit on error
set -e

# Configuration
STACK_NAME="bleujs-iam-roles"
REGION="us-west-2"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Setting up IAM roles and permissions for Bleu.js...${NC}"

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

# Create the IAM roles stack
echo "Creating IAM roles stack..."
aws cloudformation create-stack \
    --stack-name ${STACK_NAME} \
    --template-body file://.ebextensions/03_iam_roles.config \
    --capabilities CAPABILITY_IAM \
    --region ${REGION}

# Wait for stack creation to complete
echo "Waiting for stack creation to complete..."
aws cloudformation wait stack-create-complete \
    --stack-name ${STACK_NAME} \
    --region ${REGION}

# Get the role ARNs
SERVICE_ROLE_ARN=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`ServiceRoleArn`].OutputValue' \
    --output text \
    --region ${REGION})

INSTANCE_PROFILE_ARN=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`InstanceProfileArn`].OutputValue' \
    --output text \
    --region ${REGION})

echo -e "${GREEN}IAM roles and permissions setup completed successfully!${NC}"
echo -e "Service Role ARN: ${SERVICE_ROLE_ARN}"
echo -e "Instance Profile ARN: ${INSTANCE_PROFILE_ARN}"

# Create EC2 key pair if it doesn't exist
KEY_PAIR_NAME="bleujs-key-pair"
if ! aws ec2 describe-key-pairs --key-names ${KEY_PAIR_NAME} --region ${REGION} &> /dev/null; then
    echo "Creating EC2 key pair..."
    aws ec2 create-key-pair \
        --key-name ${KEY_PAIR_NAME} \
        --query 'KeyMaterial' \
        --output text \
        --region ${REGION} > ${KEY_PAIR_NAME}.pem
    
    chmod 400 ${KEY_PAIR_NAME}.pem
    echo -e "${GREEN}EC2 key pair created successfully!${NC}"
    echo -e "Key pair file: ${KEY_PAIR_NAME}.pem"
    echo -e "Please save this key pair file securely!"
else
    echo -e "${GREEN}EC2 key pair already exists.${NC}"
fi

# Update the environment settings with the new roles
echo "Updating environment settings..."
aws elasticbeanstalk update-environment \
    --environment-name bleujs-api-prod \
    --option-settings \
        Namespace=aws:autoscaling:launchconfiguration,OptionName=IamInstanceProfile,Value=aws-elasticbeanstalk-ec2-role \
        Namespace=aws:elasticbeanstalk:environment,OptionName=ServiceRole,Value=aws-elasticbeanstalk-service-role \
    --region ${REGION}

echo -e "${GREEN}Environment settings updated successfully!${NC}" 
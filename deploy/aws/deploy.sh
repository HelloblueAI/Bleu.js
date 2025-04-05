#!/bin/bash

# Exit on error
set -e

# Configuration
STACK_NAME="bleujs-infrastructure"
ENVIRONMENT=${1:-dev}  # Default to dev if not specified
REGION="us-east-1"     # Change this to your desired region

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting Bleu.js infrastructure deployment...${NC}"

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

# Create S3 bucket for CloudFormation templates if it doesn't exist
BUCKET_NAME="bleujs-cf-templates-${ENVIRONMENT}"
if ! aws s3 ls "s3://${BUCKET_NAME}" 2>&1 > /dev/null; then
    echo "Creating S3 bucket for CloudFormation templates..."
    aws s3 mb "s3://${BUCKET_NAME}" --region ${REGION}
    aws s3api put-bucket-versioning --bucket ${BUCKET_NAME} --versioning-configuration Status=Enabled
fi

# Upload CloudFormation template
echo "Uploading CloudFormation template..."
aws s3 cp infrastructure.yml "s3://${BUCKET_NAME}/infrastructure.yml"

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file infrastructure.yml \
    --stack-name ${STACK_NAME}-${ENVIRONMENT} \
    --parameter-overrides \
        EnvironmentName=${ENVIRONMENT} \
    --capabilities CAPABILITY_IAM \
    --region ${REGION}

# Get stack outputs
echo "Getting stack outputs..."
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME}-${ENVIRONMENT} \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text \
    --region ${REGION})

VM_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME}-${ENVIRONMENT} \
    --query 'Stacks[0].Outputs[?OutputKey==`VMEndpoint`].OutputValue' \
    --output text \
    --region ${REGION})

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "API Endpoint: ${API_ENDPOINT}"
echo -e "VM Endpoint: ${VM_ENDPOINT}"

# Create Route53 records if DNS is configured
if [ ! -z "$DOMAIN_NAME" ]; then
    echo "Creating DNS records..."
    aws route53 change-resource-record-sets \
        --hosted-zone-id ${HOSTED_ZONE_ID} \
        --change-batch '{
            "Changes": [
                {
                    "Action": "UPSERT",
                    "ResourceRecordSet": {
                        "Name": "api.'${DOMAIN_NAME}'",
                        "Type": "A",
                        "AliasTarget": {
                            "HostedZoneId": "'${ALB_HOSTED_ZONE_ID}'",
                            "DNSName": "'${API_ENDPOINT}'",
                            "EvaluateTargetHealth": true
                        }
                    }
                },
                {
                    "Action": "UPSERT",
                    "ResourceRecordSet": {
                        "Name": "vm.'${DOMAIN_NAME}'",
                        "Type": "A",
                        "AliasTarget": {
                            "HostedZoneId": "'${ALB_HOSTED_ZONE_ID}'",
                            "DNSName": "'${VM_ENDPOINT}'",
                            "EvaluateTargetHealth": true
                        }
                    }
                }
            ]
        }'
fi

echo -e "${GREEN}Infrastructure is ready!${NC}"
echo -e "You can now start using the API and VM services."

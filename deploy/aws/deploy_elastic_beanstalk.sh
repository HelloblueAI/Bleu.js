#!/bin/bash

# Exit on error
set -e

# Configuration
APP_NAME="bleujs-api"
ENV_NAME="bleujs-api-prod"
REGION="us-west-2"
PLATFORM="Python 3.13"
INSTANCE_TYPE="t3.medium"
MIN_INSTANCES=2
MAX_INSTANCES=4

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting Bleu.js Elastic Beanstalk deployment...${NC}"

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

# Create application if it doesn't exist
echo "Checking if application exists..."
if ! aws elasticbeanstalk describe-applications --application-names ${APP_NAME} --region ${REGION} &> /dev/null; then
    echo "Creating application ${APP_NAME}..."
    aws elasticbeanstalk create-application \
        --application-name ${APP_NAME} \
        --description "Bleu.js API Application" \
        --region ${REGION}
fi

# Create environment if it doesn't exist
echo "Checking if environment exists..."
if ! aws elasticbeanstalk describe-environments --environment-names ${ENV_NAME} --region ${REGION} &> /dev/null; then
    echo "Creating environment ${ENV_NAME}..."
    aws elasticbeanstalk create-environment \
        --application-name ${APP_NAME} \
        --environment-name ${ENV_NAME} \
        --solution-stack-name "${PLATFORM}" \
        --option-settings file://.ebextensions/02_environment_settings.config \
        --region ${REGION}
fi

# Create deployment package
echo "Creating deployment package..."
rm -rf deploy.zip
zip -r deploy.zip . -x "*.git*" "*.env*" "*.venv*" "*.pytest_cache*" "*.coverage*" "*.mypy_cache*"

# Create application version
VERSION=$(date +%Y%m%d-%H%M%S)
echo "Creating application version ${VERSION}..."
aws elasticbeanstalk create-application-version \
    --application-name ${APP_NAME} \
    --version-label ${VERSION} \
    --source-bundle S3Bucket="$(aws s3 ls | head -n 1 | awk '{print $3}')",S3Key="deploy.zip" \
    --region ${REGION}

# Upload deployment package to S3
echo "Uploading deployment package to S3..."
aws s3 cp deploy.zip s3://$(aws s3 ls | head -n 1 | awk '{print $3}')/deploy.zip --region ${REGION}

# Deploy the application
echo "Deploying application version ${VERSION}..."
aws elasticbeanstalk update-environment \
    --application-name ${APP_NAME} \
    --environment-name ${ENV_NAME} \
    --version-label ${VERSION} \
    --region ${REGION}

# Wait for deployment to complete
echo "Waiting for deployment to complete..."
aws elasticbeanstalk wait-for-environment-update \
    --environment-name ${ENV_NAME} \
    --region ${REGION}

# Get environment URL
ENV_URL=$(aws elasticbeanstalk describe-environments \
    --environment-names ${ENV_NAME} \
    --query 'Environments[0].CNAME' \
    --output text \
    --region ${REGION})

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "Environment URL: http://${ENV_URL}"

# Test the deployment
echo "Testing deployment..."
curl -s http://${ENV_URL}/health || echo "Health check failed, please check the logs"

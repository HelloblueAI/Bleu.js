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

echo -e "${YELLOW}Starting AWS environment setup...${NC}"

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

# Create S3 bucket if it doesn't exist
if ! aws s3 ls "s3://${S3_BUCKET}" &> /dev/null; then
    echo -e "${YELLOW}Creating S3 bucket for deployments...${NC}"
    aws s3 mb "s3://${S3_BUCKET}" --region "${REGION}"
    aws s3api put-bucket-versioning --bucket "${S3_BUCKET}" --versioning-configuration Status=Enabled
fi

# Create Elastic Beanstalk application if it doesn't exist
if ! aws elasticbeanstalk describe-applications --application-names "${APP_NAME}" &> /dev/null; then
    echo -e "${YELLOW}Creating Elastic Beanstalk application...${NC}"
    aws elasticbeanstalk create-application --application-name "${APP_NAME}"
fi

# Create Elastic Beanstalk environment if it doesn't exist
if ! aws elasticbeanstalk describe-environments --environment-names "${ENV_NAME}" &> /dev/null; then
    echo -e "${YELLOW}Creating Elastic Beanstalk environment...${NC}"

    # Create environment configuration
    cat > .ebextensions/01_environment.config << EOF
option_settings:
  aws:elasticbeanstalk:application:environment:
    PYTHONPATH: "/var/app/current"
    DJANGO_SETTINGS_MODULE: "bleujs.settings"
    ALLOWED_HOSTS: ".elasticbeanstalk.com"
    DEBUG: "False"
EOF

    # Create environment
    aws elasticbeanstalk create-environment \
        --application-name "${APP_NAME}" \
        --environment-name "${ENV_NAME}" \
        --platform-version "${PLATFORM}" \
        --option-settings file://.ebextensions/01_environment.config \
        --tier Name=WebServer,Type=Standard,Version="1.0" \
        --version-label "initial"
fi

# Create requirements.txt if it doesn't exist
if [ ! -f requirements.txt ]; then
    echo -e "${YELLOW}Creating requirements.txt...${NC}"
    cat > requirements.txt << EOF
Django>=4.2.0
djangorestframework>=3.14.0
psycopg2-binary>=2.9.9
python-dotenv>=1.0.0
gunicorn>=21.2.0
whitenoise>=6.6.0
EOF
fi

# Create Procfile if it doesn't exist
if [ ! -f Procfile ]; then
    echo -e "${YELLOW}Creating Procfile...${NC}"
    echo "web: gunicorn bleujs.wsgi:application --timeout 120" > Procfile
fi

echo -e "${GREEN}AWS environment setup completed successfully!${NC}"
echo -e "${YELLOW}You can now run ./scripts/deploy.sh to deploy your application.${NC}"

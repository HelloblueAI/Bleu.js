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
HEALTH_CHECK_TIMEOUT=300  # 5 minutes
MAX_DEPLOYMENT_TIME=1800  # 30 minutes
ALARM_THRESHOLD=5        # Number of failed health checks before rollback

echo -e "${YELLOW}Starting intelligent deployment process...${NC}"

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}AWS credentials are not configured. Please configure them first.${NC}"
        exit 1
    fi

    # Check required environment variables
    local required_vars=("STRIPE_PUBLIC_KEY" "STRIPE_SECRET_KEY" "STRIPE_WEBHOOK_SECRET"
                        "AWS_SES_USER" "AWS_SES_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}Required environment variable $var is not set.${NC}"
            exit 1
        fi
    done
}

# Create deployment package
create_deployment_package() {
    echo -e "${YELLOW}Creating deployment package...${NC}"

    # Clean up old deployment packages
    rm -rf deploy.zip

    # Create new deployment package
    zip -r deploy.zip . -x "*.git*" "*.env*" "*.venv*" "*.pytest_cache*" "*.coverage*" "*.mypy_cache*"

    # Upload to S3 with versioning
    VERSION_LABEL="v$(date +%Y%m%d-%H%M%S)"
    aws s3 cp deploy.zip "s3://${S3_BUCKET}/${VERSION_LABEL}/deploy.zip"

    echo "$VERSION_LABEL"
}

# Deploy to Elastic Beanstalk
deploy_to_eb() {
    local version_label=$1
    echo -e "${YELLOW}Deploying version ${version_label} to Elastic Beanstalk...${NC}"

    # Create application version
    aws elasticbeanstalk create-application-version \
        --application-name "${APP_NAME}" \
        --version-label "${version_label}" \
        --source-bundle S3Bucket="${S3_BUCKET}",S3Key="${version_label}/deploy.zip" \
        --auto-create-application

    # Update environment
    aws elasticbeanstalk update-environment \
        --environment-name "${ENV_NAME}" \
        --version-label "${version_label}"
}

# Monitor deployment health
monitor_deployment() {
    local version_label=$1
    local start_time=$(date +%s)
    local failed_checks=0

    echo -e "${YELLOW}Monitoring deployment health...${NC}"

    while true; do
        local current_time=$(date +%s)
        local elapsed_time=$((current_time - start_time))

        # Check if deployment timeout reached
        if [ $elapsed_time -gt $MAX_DEPLOYMENT_TIME ]; then
            echo -e "${RED}Deployment timeout reached. Initiating rollback...${NC}"
            rollback_deployment "$version_label"
            exit 1
        fi

        # Get environment status
        local status=$(aws elasticbeanstalk describe-environments \
            --environment-names "${ENV_NAME}" \
            --query 'Environments[0].Status' \
            --output text)

        # Get health status
        local health=$(aws elasticbeanstalk describe-environments \
            --environment-names "${ENV_NAME}" \
            --query 'Environments[0].Health' \
            --output text)

        echo -e "${YELLOW}Status: $status, Health: $health${NC}"

        # Check if deployment is complete
        if [ "$status" = "Ready" ]; then
            if [ "$health" = "Green" ]; then
                echo -e "${GREEN}Deployment completed successfully!${NC}"
                return 0
            else
                failed_checks=$((failed_checks + 1))
                if [ $failed_checks -ge $ALARM_THRESHOLD ]; then
                    echo -e "${RED}Health check failed ${ALARM_THRESHOLD} times. Initiating rollback...${NC}"
                    rollback_deployment "$version_label"
                    exit 1
                fi
            fi
        elif [ "$status" = "Failed" ]; then
            echo -e "${RED}Deployment failed!${NC}"
            rollback_deployment "$version_label"
            exit 1
        fi

        sleep 30
    done
}

# Rollback deployment
rollback_deployment() {
    local failed_version=$1
    echo -e "${YELLOW}Initiating rollback to previous version...${NC}"

    # Get previous version
    local previous_version=$(aws elasticbeanstalk describe-application-versions \
        --application-name "${APP_NAME}" \
        --query 'ApplicationVersions[?VersionLabel!=`'"${failed_version}"'`] | sort_by(@, &DateCreated)[-1].VersionLabel' \
        --output text)

    if [ -z "$previous_version" ]; then
        echo -e "${RED}No previous version found for rollback.${NC}"
        exit 1
    fi

    # Deploy previous version
    aws elasticbeanstalk update-environment \
        --environment-name "${ENV_NAME}" \
        --version-label "${previous_version}"

    # Monitor rollback
    monitor_deployment "$previous_version"
}

# Post-deployment checks
post_deployment_checks() {
    echo -e "${YELLOW}Running post-deployment checks...${NC}"

    # Get environment URL
    local env_url=$(aws elasticbeanstalk describe-environments \
        --environment-names "${ENV_NAME}" \
        --query 'Environments[0].CNAME' \
        --output text)

    # Check application health endpoint
    local health_check=$(curl -s -o /dev/null -w "%{http_code}" "https://${env_url}/health/")
    if [ "$health_check" != "200" ]; then
        echo -e "${RED}Health check endpoint returned status code $health_check${NC}"
        return 1
    fi

    # Check database connection
    local db_check=$(curl -s -o /dev/null -w "%{http_code}" "https://${env_url}/api/health/db/")
    if [ "$db_check" != "200" ]; then
        echo -e "${RED}Database health check failed${NC}"
        return 1
    fi

    # Check payment gateway connection
    local payment_check=$(curl -s -o /dev/null -w "%{http_code}" "https://${env_url}/api/health/payment/")
    if [ "$payment_check" != "200" ]; then
        echo -e "${RED}Payment gateway health check failed${NC}"
        return 1
    fi

    echo -e "${GREEN}All post-deployment checks passed!${NC}"
}

# Main deployment process
main() {
    check_prerequisites

    # Create and upload deployment package
    version_label=$(create_deployment_package)

    # Deploy to Elastic Beanstalk
    deploy_to_eb "$version_label"

    # Monitor deployment
    monitor_deployment "$version_label"

    # Run post-deployment checks
    post_deployment_checks

    echo -e "${GREEN}Deployment completed successfully!${NC}"
    echo -e "${YELLOW}Your application is now live and ready to generate revenue!${NC}"
}

# Run main function
main

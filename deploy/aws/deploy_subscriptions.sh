#!/bin/bash

# Exit on error
set -e

# Configuration
STACK_NAME="bleujs-subscriptions"
ENVIRONMENT=${1:-dev}  # Default to dev if not specified
REGION="us-east-1"     # Change this to your desired region

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting Bleu.js subscription system deployment...${NC}"

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

# Deploy subscription infrastructure
echo "Deploying subscription infrastructure..."
aws cloudformation deploy \
    --template-file subscriptions.yml \
    --stack-name ${STACK_NAME}-${ENVIRONMENT} \
    --parameter-overrides \
        EnvironmentName=${ENVIRONMENT} \
    --capabilities CAPABILITY_IAM \
    --region ${REGION}

# Deploy subscription Lambda function
echo "Deploying subscription Lambda function..."
aws cloudformation deploy \
    --template-file subscription_lambda.yml \
    --stack-name ${STACK_NAME}-lambda-${ENVIRONMENT} \
    --parameter-overrides \
        EnvironmentName=${ENVIRONMENT} \
    --capabilities CAPABILITY_IAM \
    --region ${REGION}

# Get stack outputs
echo "Getting stack outputs..."
SUBSCRIPTION_API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME}-lambda-${ENVIRONMENT} \
    --query 'Stacks[0].Outputs[?OutputKey==`SubscriptionApiEndpoint`].OutputValue' \
    --output text \
    --region ${REGION})

SUBSCRIPTION_FUNCTION_ARN=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME}-lambda-${ENVIRONMENT} \
    --query 'Stacks[0].Outputs[?OutputKey==`SubscriptionFunctionArn`].OutputValue' \
    --output text \
    --region ${REGION})

# Create API Gateway usage plans
echo "Creating API Gateway usage plans..."
aws apigateway create-usage-plan \
    --name "Basic Plan" \
    --description "Basic plan - 100 API calls per month" \
    --api-stages "[{\"apiId\": \"${SUBSCRIPTION_API_ENDPOINT}\", \"stage\": \"${ENVIRONMENT}\"}]" \
    --quota "{\"limit\": 100, \"period\": \"MONTH\"}" \
    --throttle "{\"burstLimit\": 10, \"rateLimit\": 5}" \
    --region ${REGION}

aws apigateway create-usage-plan \
    --name "Enterprise Plan" \
    --description "Enterprise plan - 5000 API calls per month with 24/7 support" \
    --api-stages "[{\"apiId\": \"${SUBSCRIPTION_API_ENDPOINT}\", \"stage\": \"${ENVIRONMENT}\"}]" \
    --quota "{\"limit\": 5000, \"period\": \"MONTH\"}" \
    --throttle "{\"burstLimit\": 100, \"rateLimit\": 50}" \
    --region ${REGION}

# Create CloudWatch alarms for usage monitoring
echo "Creating CloudWatch alarms..."
aws cloudwatch put-metric-alarm \
    --alarm-name "${STACK_NAME}-basic-usage-alarm" \
    --alarm-description "Alert when basic tier usage exceeds 90% of quota" \
    --metric-name "Count" \
    --namespace "AWS/ApiGateway" \
    --statistic "Sum" \
    --period 3600 \
    --evaluation-periods 1 \
    --threshold 90 \
    --comparison-operator "GreaterThanThreshold" \
    --dimensions "Name=ApiKey,Value=${SUBSCRIPTION_FUNCTION_ARN}" \
    --alarm-actions "arn:aws:sns:${REGION}:${AWS_ACCOUNT_ID}:${STACK_NAME}-usage-alerts" \
    --region ${REGION}

aws cloudwatch put-metric-alarm \
    --alarm-name "${STACK_NAME}-enterprise-usage-alarm" \
    --alarm-description "Alert when enterprise tier usage exceeds 90% of quota" \
    --metric-name "Count" \
    --namespace "AWS/ApiGateway" \
    --statistic "Sum" \
    --period 3600 \
    --evaluation-periods 1 \
    --threshold 4500 \
    --comparison-operator "GreaterThanThreshold" \
    --dimensions "Name=ApiKey,Value=${SUBSCRIPTION_FUNCTION_ARN}" \
    --alarm-actions "arn:aws:sns:${REGION}:${AWS_ACCOUNT_ID}:${STACK_NAME}-usage-alerts" \
    --region ${REGION}

echo -e "${GREEN}Subscription system deployment completed successfully!${NC}"
echo -e "Subscription API Endpoint: ${SUBSCRIPTION_API_ENDPOINT}"
echo -e "Subscription Function ARN: ${SUBSCRIPTION_FUNCTION_ARN}"

# Test the subscription system
echo "Testing subscription system..."
curl -X POST "${SUBSCRIPTION_API_ENDPOINT}/subscriptions" \
    -H "Content-Type: application/json" \
    -d '{"action":"create","userId":"test-user","tier":"basic"}'

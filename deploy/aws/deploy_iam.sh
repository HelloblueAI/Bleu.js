#!/bin/bash

# Exit on error
set -e

# Configuration
STACK_NAME="bleujs-iam-roles"
REGION="us-west-2"

echo "Creating IAM roles stack..."
aws cloudformation create-stack \
    --stack-name ${STACK_NAME} \
    --template-body file://deploy/aws/iam_roles.yml \
    --capabilities CAPABILITY_NAMED_IAM \
    --region ${REGION}

echo "Waiting for stack creation to complete..."
aws cloudformation wait stack-create-complete \
    --stack-name ${STACK_NAME} \
    --region ${REGION}

echo "IAM roles created successfully!" 
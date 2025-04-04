#!/bin/bash

echo "Configuring AWS CLI for Bleu.js infrastructure tests"
echo "=================================================="
echo

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Configure AWS CLI
echo "Please enter your AWS credentials:"
echo "--------------------------------"
echo "Region [us-west-2]: "
read region
region=${region:-us-west-2}

echo "AWS Access Key ID: "
read aws_access_key_id

echo "AWS Secret Access Key: "
read -s aws_secret_access_key
echo

# Configure AWS CLI
aws configure set region "$region"
aws configure set aws_access_key_id "$aws_access_key_id"
aws configure set aws_secret_access_key "$aws_secret_access_key"

# Test configuration
echo "\nTesting AWS configuration..."
if aws sts get-caller-identity &> /dev/null; then
    echo "✅ AWS configuration successful!"
    echo "Now you can run the infrastructure tests:"
    echo "python tests/infrastructure_health_check.py"
else
    echo "❌ AWS configuration failed. Please check your credentials and try again."
fi 
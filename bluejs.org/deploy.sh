#!/bin/bash
set -e

echo "🚀 Starting Bleu.js deployment"
echo "----------------------------------------"

# Create EC2 key pair
echo "🔑 Creating EC2 key pair..."
aws ec2 create-key-pair --key-name bleujs-key --query KeyMaterial --output text > bleujs-key.pem
chmod 400 bleujs-key.pem

# Deploy EC2 stack
echo "🖥️ Deploying EC2 instance..."
aws cloudformation deploy \n    --template-file cloudformation/ec2-setup.yaml \n    --stack-name bleujs-ec2 \n    --parameter-overrides KeyName=bleujs-key \n    --capabilities CAPABILITY_IAM

# Get EC2 instance details
echo "🔍 Getting EC2 instance information..."
aws cloudformation describe-stacks \n    --stack-name bleujs-ec2 \n    --query "Stacks[0].Outputs" \n    --output table
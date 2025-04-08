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
aws cloudformation deploy \
    --template-file cloudformation/ec2-setup.yaml \
    --stack-name bleujs-ec2 \
    --parameter-overrides KeyName=bleujs-key \
    --capabilities CAPABILITY_IAM

# Get EC2 instance details
echo "🔍 Getting EC2 instance information..."
aws cloudformation describe-stacks \
    --stack-name bleujs-ec2 \
    --query 'Stacks[0].Outputs' \
    --output table

echo "✅ Deployment completed successfully!"
echo "To connect to your EC2 instance:"
echo "ssh -i bleujs-key.pem ec2-user@<PublicIP>" 
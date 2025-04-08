#!/bin/bash

# Setup script for Bleu.js deployment using AWS CloudShell
set -e

echo "🚀 Setting up Bleu.js deployment environment in CloudShell"
echo "----------------------------------------"

# Generate a certificate for authentication
echo "🔐 Generating certificate..."
openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 \
    -keyout bleujs-cert.key -out bleujs-cert.pem \
    -subj "/C=US/ST=California/L=San Francisco/O=Bleu.js/OU=Deployment/CN=bleujs.org"

# Convert certificate to base64
CERT_BUNDLE=$(cat bleujs-cert.pem | base64)

# Deploy the CloudFormation stack
echo "📦 Deploying IAM Roles Anywhere configuration..."
aws cloudformation deploy \
    --template-file cloudformation/roles-anywhere.yaml \
    --stack-name bleujs-roles-anywhere \
    --parameter-overrides "CertificateBundle=$CERT_BUNDLE" \
    --capabilities CAPABILITY_NAMED_IAM

# Get the stack outputs
echo "🔍 Getting deployment information..."
aws cloudformation describe-stacks \
    --stack-name bleujs-roles-anywhere \
    --query 'Stacks[0].Outputs' \
    --output table

echo "✅ Setup completed successfully!"
echo "Your certificate files are:"
echo "- Private key: bleujs-cert.key"
echo "- Public certificate: bleujs-cert.pem"
echo ""
echo "Keep these files secure - you'll need them for deployment."

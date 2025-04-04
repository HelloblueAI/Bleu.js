#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Setting up environment variables...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    touch .env
fi

# Function to set environment variable
set_env_var() {
    local var_name=$1
    local var_value=$2
    if grep -q "^${var_name}=" .env; then
        sed -i '' "s|^${var_name}=.*|${var_name}=${var_value}|" .env
    else
        echo "${var_name}=${var_value}" >> .env
    fi
    export "${var_name}=${var_value}"
}

# Set required environment variables
set_env_var "STRIPE_PUBLIC_KEY" "your_stripe_public_key"
set_env_var "STRIPE_SECRET_KEY" "your_stripe_secret_key"
set_env_var "STRIPE_WEBHOOK_SECRET" "your_stripe_webhook_secret"
set_env_var "AWS_SES_USER" "your_aws_ses_username"
set_env_var "AWS_SES_PASSWORD" "your_aws_ses_password"
set_env_var "ALERT_EMAIL" "alerts@bleujs.com"

echo -e "${GREEN}Environment variables have been set up.${NC}"
echo -e "${YELLOW}Please update the values in .env with your actual credentials.${NC}" 
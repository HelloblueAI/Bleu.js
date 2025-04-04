#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting interactive configuration...${NC}"

# Function to prompt for input
prompt_input() {
    local var_name=$1
    local description=$2
    local is_secret=$3
    
    echo -e "${YELLOW}$description${NC}"
    if [ "$is_secret" = "true" ]; then
        read -s -p "Enter value: " value
        echo
    else
        read -p "Enter value: " value
    fi
    
    # Update .env file
    if grep -q "^${var_name}=" .env; then
        sed -i '' "s|^${var_name}=.*|${var_name}=${value}|" .env
    else
        echo "${var_name}=${value}" >> .env
    fi
    
    # Export variable
    export "${var_name}=${value}"
}

# Check AWS CLI configuration
echo -e "${YELLOW}Checking AWS CLI configuration...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}AWS CLI is not configured. Please configure it first:${NC}"
    aws configure
fi

# Get AWS region
AWS_REGION=$(aws configure get region)
if [ -z "$AWS_REGION" ]; then
    prompt_input "AWS_REGION" "Enter AWS region (e.g., us-east-1): " false
else
    echo -e "${GREEN}Using AWS region: $AWS_REGION${NC}"
    export AWS_REGION
fi

# Configure Stripe
echo -e "${YELLOW}Configuring Stripe credentials...${NC}"
echo -e "${YELLOW}Do you have a Stripe account? (y/n)${NC}"
read -p "Enter y/n: " has_stripe

if [ "$has_stripe" = "n" ]; then
    echo -e "${YELLOW}Setting up development mode with placeholder Stripe keys...${NC}"
    echo -e "${YELLOW}Please follow these steps to set up Stripe:${NC}"
    echo "1. Go to https://dashboard.stripe.com/register"
    echo "2. Create a free account"
    echo "3. Once logged in, go to Developers → API keys"
    echo "4. Copy your publishable key (starts with pk_test_)"
    echo "5. Copy your secret key (starts with sk_test_)"
    echo -e "${YELLOW}After setting up your account, run this script again to configure the keys.${NC}"
    
    # Set placeholder values
    set_env_var "STRIPE_PUBLIC_KEY" "pk_test_placeholder"
    set_env_var "STRIPE_SECRET_KEY" "sk_test_placeholder"
    set_env_var "STRIPE_WEBHOOK_SECRET" "whsec_placeholder"
else
    prompt_input "STRIPE_PUBLIC_KEY" "Enter your Stripe public key (starts with pk_test_): " true
    prompt_input "STRIPE_SECRET_KEY" "Enter your Stripe secret key (starts with sk_test_): " true
    prompt_input "STRIPE_WEBHOOK_SECRET" "Enter your Stripe webhook secret (starts with whsec_): " true
fi

# Configure AWS SES
echo -e "${YELLOW}Configuring AWS SES credentials...${NC}"
echo -e "${YELLOW}Do you have AWS SES configured? (y/n)${NC}"
read -p "Enter y/n: " has_ses

if [ "$has_ses" = "n" ]; then
    echo -e "${YELLOW}Setting up development mode with placeholder SES credentials...${NC}"
    echo -e "${YELLOW}To set up AWS SES:${NC}"
    echo "1. Go to AWS Console → SES"
    echo "2. Create SMTP credentials"
    echo "3. Verify your email domain"
    echo -e "${YELLOW}After setting up SES, run this script again to configure the credentials.${NC}"
    
    # Set placeholder values
    set_env_var "AWS_SES_USER" "placeholder_ses_user"
    set_env_var "AWS_SES_PASSWORD" "placeholder_ses_password"
else
    prompt_input "AWS_SES_USER" "Enter your AWS SES SMTP username: " true
    prompt_input "AWS_SES_PASSWORD" "Enter your AWS SES SMTP password: " true
fi

# Configure alert email
prompt_input "ALERT_EMAIL" "Enter email address for alerts: " false

# Configure application settings
echo -e "${YELLOW}Configuring application settings...${NC}"
prompt_input "APP_NAME" "Enter application name (default: bleujs): " false
prompt_input "ENV_NAME" "Enter environment name (default: bleujs-prod): " false

# Set defaults if not provided
if [ -z "$APP_NAME" ]; then
    APP_NAME="bleujs"
    echo "APP_NAME=bleujs" >> .env
fi

if [ -z "$ENV_NAME" ]; then
    ENV_NAME="bleujs-prod"
    echo "ENV_NAME=bleujs-prod" >> .env
fi

# Verify configuration
echo -e "${YELLOW}Verifying configuration...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}Configuration saved to .env${NC}"
    echo -e "${YELLOW}Current configuration:${NC}"
    grep -v '^#' .env | grep -v '^$'
else
    echo -e "${RED}Failed to save configuration${NC}"
    exit 1
fi

echo -e "${GREEN}Configuration completed successfully!${NC}"
if [ "$has_stripe" = "n" ] || [ "$has_ses" = "n" ]; then
    echo -e "${YELLOW}Note: Some services are using placeholder values.${NC}"
    echo -e "${YELLOW}Please set up the required services and run this script again to update the credentials.${NC}"
else
    echo -e "${YELLOW}You can now run ./scripts/deploy.sh to start the deployment.${NC}"
fi 
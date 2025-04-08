#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Starting Bleu.js Integration Tests"
echo "----------------------------------------"

# Create and activate virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install test dependencies
echo "Installing test dependencies..."
pip install -r requirements-test.txt

# Check for EC2 key file
if [ ! -f "bleu-js-key.pem" ]; then
    echo -e "${RED}Error: bleu-js-key.pem not found${NC}"
    echo "Please place the EC2 key file in the project root directory"
    exit 1
fi

# Set proper permissions for the key file
chmod 400 bleu-js-key.pem

# Run API Gateway tests
echo "Running API Gateway Tests..."
pytest tests/integration/test_api_integration.py -v -m "api"

# Run EC2 service tests
echo "Running EC2 Service Tests..."
pytest tests/integration/test_ec2_services.py -v -m "ec2"

# Check test result
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All tests completed successfully!"
else
    echo -e "${RED}✗${NC} Some tests failed!"
    exit 1
fi

echo "----------------------------------------" 
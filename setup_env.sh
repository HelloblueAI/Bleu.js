#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Setting up Bleu.js development environment...${NC}"

# Check Python version
if ! command -v python3.11 &> /dev/null; then
    echo -e "${RED}Python 3.11 is required but not found. Please install it first.${NC}"
    exit 1
fi

# Create and activate virtual environment
echo -e "${YELLOW}Creating virtual environment...${NC}"
python3.11 -m venv bleujs-env
source bleujs-env/bin/activate

# Upgrade pip and install basic tools
echo -e "${YELLOW}Upgrading pip and installing basic tools...${NC}"
python -m pip install --upgrade pip
pip install wheel setuptools

# Install core dependencies first
echo -e "${YELLOW}Installing core dependencies...${NC}"
pip install numpy>=1.24.4
pip install tensorflow==2.15.0
pip install torch==2.2.2 torchvision==0.17.2

# Install quantum computing dependencies
echo -e "${YELLOW}Installing quantum computing dependencies...${NC}"
pip install qiskit>=1.1.0 cirq==1.2.0 pennylane==0.30.0

# Install API and web framework
echo -e "${YELLOW}Installing API and web framework...${NC}"
pip install fastapi==0.115.12 uvicorn==0.34.0 python-multipart==0.0.6 pydantic>=2.9.2

# Install database dependencies
echo -e "${YELLOW}Installing database dependencies...${NC}"
pip install sqlalchemy==2.0.40 alembic==1.11.0 psycopg2-binary==2.9.0

# Install testing and development tools
echo -e "${YELLOW}Installing testing and development tools...${NC}"
pip install pytest==8.3.5 pytest-cov==4.1.0 black==25.1.0 isort==5.12.0 flake8==7.1.2 mypy==1.15.0

# Install monitoring and logging tools
echo -e "${YELLOW}Installing monitoring and logging tools...${NC}"
pip install python-json-logger==2.0.0 prometheus-client==0.17.0 opentelemetry-api==1.20.0 opentelemetry-sdk==1.20.0

# Install security packages
echo -e "${YELLOW}Installing security packages...${NC}"
pip install python-jose[cryptography]==3.3.0 passlib[bcrypt]==1.7.4 python-dotenv==1.0.0

# Install remaining utilities
echo -e "${YELLOW}Installing utilities...${NC}"
pip install tqdm==4.65.0 requests==2.32.3 aiohttp==3.8.0 tenacity==8.2.0

# Run tests to verify installation
echo -e "${YELLOW}Running tests to verify installation...${NC}"
python -m pytest tests/ -v

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p logs data storage mlruns

# Set up pre-commit hooks
echo -e "${YELLOW}Setting up pre-commit hooks...${NC}"
pre-commit install

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${YELLOW}To activate the environment, run: source bleujs-env/bin/activate${NC}" 
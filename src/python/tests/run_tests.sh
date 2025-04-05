#!/bin/bash

# Exit on error
set -e

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install test dependencies
pip install -r requirements-test.txt

# Run tests with coverage
pytest --cov=.. --cov-report=term-missing -v

# Deactivate virtual environment
deactivate

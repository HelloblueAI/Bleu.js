#!/bin/bash

# Exit on error
set -e

echo "Starting test suite..."

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt
pip install pytest pytest-asyncio pytest-cov black isort mypy

# Run linting
echo "Running linting..."
black --check src/ tests/
isort --check-only src/ tests/
mypy src/ tests/

# Run tests with coverage
echo "Running tests..."
pytest tests/ -v --cov=src --cov-report=term-missing

# Generate coverage report
echo "Generating coverage report..."
coverage html

echo "Test suite completed successfully!" 
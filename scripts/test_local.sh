#!/bin/bash

# Exit on error
set -e

echo "Running local tests before push..."

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt
pip install -r requirements-types.txt
pip install mypy black pytest pytest-cov pytest-asyncio

# Run Black formatting check
echo "Running Black formatting check..."
black . --check

# Run mypy type checking
echo "Running mypy type checking..."
mypy .

# Run pytest with coverage
echo "Running pytest with coverage..."
pytest --cov=src tests/ --cov-report=term-missing

# Run security checks
echo "Running security checks..."
pip install bandit
bandit -r src/

# Run linting
echo "Running linting..."
pip install flake8
flake8 src/ tests/

echo "All checks passed! You can now push to CI/CD." 
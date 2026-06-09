#!/bin/bash

# Exit on error
set -e

echo "Running local tests before push..."

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements-ci.txt
pip install -r requirements-dev.txt
pip install -r requirements-types.txt

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
bandit -r src/

# Run linting
echo "Running linting..."
flake8 src/ tests/

echo "All checks passed! You can now push to CI/CD."

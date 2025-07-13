#!/bin/bash
# Real Terminal Demo for Bleu.js
# This script shows the actual installation and usage process

set -e

echo "🚀 Bleu.js Real Terminal Demo"
echo "=============================="
echo ""

# Check current directory
echo "📍 Current directory:"
pwd
ls -la
echo ""

# Check git status
echo "📊 Git status:"
git status --porcelain || echo "No git repository"
echo ""

# Check Python version
echo "🐍 Python version:"
python3 --version
echo ""

# Create virtual environment
echo "🔧 Creating virtual environment..."
python3 -m venv bleujs-demo-env
echo "✅ Virtual environment created"
echo ""

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source bleujs-demo-env/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Check pip version
echo "📦 Pip version:"
pip --version
echo ""

# Install Bleu.js
echo "📥 Installing Bleu.js..."
pip install -e .
echo "✅ Bleu.js installed"
echo ""

# Verify installation
echo "🔍 Verifying installation:"
pip list | grep -i bleu
echo ""

# Test import
echo "🧪 Testing Bleu.js import..."
python3 -c "from src.bleujs import BleuJS; print('✅ Bleu.js imported successfully')"
echo ""

# Run sample usage
echo "🎯 Running sample usage..."
python3 examples/sample_usage.py
echo ""

# Show project structure
echo "📁 Project structure:"
tree -I '__pycache__|*.pyc|*.egg-info' -L 2 || ls -la
echo ""

echo "🎉 Demo completed successfully!"
echo "✨ Bleu.js is ready to use!"

#!/bin/bash

# Real Bleu.js Installation and Usage Demo
set -e

echo "🚀 Bleu.js Real Terminal Demo"
echo "=============================="
echo ""

# Show current directory
echo "📍 Current directory:"
pwd
ls -la
echo ""

# Show git status
echo "📊 Git status:"
git status --porcelain || echo "No git repository"
echo ""

# Show Python version
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

# Show pip version
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
python3 -c "from src.bleujs import BleuJS; print('✅ Bleu.js imported successfully')" || echo "⚠️ Import test failed"
echo ""

# Show project structure
echo "📁 Project structure:"
ls -la src/
echo ""

# Show examples
echo "📚 Available examples:"
ls -la examples/
echo ""

# Show README
echo "📖 README preview:"
head -10 README.md
echo ""

echo "🎉 Demo completed successfully!"
echo "✨ Bleu.js is ready to use!"

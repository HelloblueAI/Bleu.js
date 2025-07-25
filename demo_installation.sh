#!/bin/bash

# Bleu.js Installation Demo
echo "🚀 Bleu.js Installation Demo"
echo "============================="
echo ""

# Show current directory
echo "📍 Current directory:"
pwd
echo ""

# Show project structure
echo "📁 Project structure:"
ls -la | head -10
echo "..."

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
pip install -e . --quiet
echo "✅ Bleu.js installed"
echo ""

# Verify installation
echo "🔍 Verifying installation:"
pip list | grep -i bleu
echo ""

# Show project structure
echo "📁 Project structure:"
ls -la src/
echo ""

# Show examples
echo "📚 Available examples:"
ls -la examples/
echo ""

echo "🎉 Installation completed successfully!"
echo "✨ Bleu.js is ready to use!"

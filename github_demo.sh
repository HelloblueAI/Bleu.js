#!/bin/bash

echo "🚀 Bleu.js Installation Demo"
echo "============================="
echo ""

echo "📍 Current directory:"
pwd
echo ""

echo "📁 Project structure:"
ls -la | head -5
echo "..."

echo "🐍 Python version:"
python3 --version
echo ""

echo "🔧 Creating virtual environment..."
python3 -m venv bleujs-demo-env
echo "✅ Virtual environment created"
echo ""

echo "🔌 Activating virtual environment..."
source bleujs-demo-env/bin/activate
echo "✅ Virtual environment activated"
echo ""

echo "📦 Pip version:"
pip --version
echo ""

echo "📥 Installing Bleu.js..."
pip install -e . --quiet
echo "✅ Bleu.js installed"
echo ""

echo "🔍 Verifying installation:"
pip list | grep -i bleu
echo ""

echo "📁 Project structure:"
ls -la src/
echo ""

echo "📚 Available examples:"
ls -la examples/
echo ""

echo "🎉 Installation completed successfully!"
echo "✨ Bleu.js is ready to use!"

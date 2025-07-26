#!/bin/bash

# Record Real Terminal Demo for Bleu.js
# This script records the actual installation and usage process

echo "🎬 Recording Real Terminal Demo for Bleu.js"
echo "============================================="

# Check if asciinema is installed
if ! command -v asciinema &> /dev/null; then
    echo "📦 Installing asciinema..."
    sudo apt-get update
    sudo apt-get install -y asciinema
fi

# Create a clean demo script
cat > real_demo_script.sh << 'EOF'
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
EOF

chmod +x real_demo_script.sh

# Record the demo
echo "🎥 Starting recording..."
asciinema rec real_terminal_demo.cast -c "./real_demo_script.sh"

echo "✅ Recording completed!"
echo "📁 Files created:"
echo "  - real_terminal_demo.cast"
echo "  - real_demo_script.sh"

# Convert to GIF if asciicast2gif is available
if command -v asciicast2gif &> /dev/null; then
    echo "🔄 Converting to GIF..."
    asciicast2gif real_terminal_demo.cast real_terminal_demo.gif
    echo "✅ GIF created: real_terminal_demo.gif"
else
    echo "📝 To convert to GIF, install asciicast2gif:"
    echo "   npm install -g asciicast2gif"
    echo "   asciicast2gif real_terminal_demo.cast real_terminal_demo.gif"
fi

echo ""
echo "🎬 Demo recording complete!"
echo "📤 Upload the GIF to replace terminal-demo.gif"

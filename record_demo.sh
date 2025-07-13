#!/bin/bash

# Bleu.js Terminal Demo Recording Script
# This script helps record a terminal demo of Bleu.js

echo "🎬 Bleu.js Terminal Demo Recording Setup"
echo "========================================"
echo ""

# Check if asciinema is installed
if ! command -v asciinema &> /dev/null; then
    echo "📦 Installing asciinema for terminal recording..."
    sudo apt-get update
    sudo apt-get install -y asciinema
fi

# Check if we're in a terminal that supports colors
if [ -t 1 ]; then
    echo "✅ Terminal supports colors and animations"
else
    echo "⚠️  Terminal may not support colors properly"
fi

echo ""
echo "🎯 Recording Instructions:"
echo "1. Run: asciinema rec bleu-demo.cast"
echo "2. In the recording session, run: python demo_terminal.py"
echo "3. Wait for the demo to complete"
echo "4. Press Ctrl+D to stop recording"
echo "5. Convert to GIF: asciinema play bleu-demo.cast"
echo ""
echo "📹 Alternative: Use screen recording software like:"
echo "   - SimpleScreenRecorder (Linux)"
echo "   - OBS Studio"
echo "   - Built-in screen recorder"
echo ""
echo "🎨 For best results:"
echo "   - Use a dark terminal theme"
echo "   - Set terminal size to 80x24 or larger"
echo "   - Use a monospace font (like 'Fira Code')"
echo ""

# Test the demo script
echo "🧪 Testing demo script..."
python demo_terminal.py

echo ""
echo "✨ Ready to record! Follow the instructions above."

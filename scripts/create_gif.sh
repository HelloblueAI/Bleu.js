#!/bin/bash

# Create GIF from Bleu.js Magical Demo
echo "🎬 Creating GIF from Bleu.js Magical Demo"
echo "=========================================="
echo ""

# Check if we have the demo files
if [ ! -f "magical-bleu-demo.cast" ]; then
    echo "❌ Magical demo cast file not found!"
    exit 1
fi

echo "✅ Found magical demo cast file"
echo ""

# Method 1: Using asciinema with screen recording
echo "🎯 Method 1: Screen Recording"
echo "1. Open a new terminal window"
echo "2. Run this command:"
echo "   asciinema play magical-bleu-demo.cast"
echo "3. Use your system's screen recorder to record the terminal"
echo "4. Save as: terminal-demo.gif"
echo ""

# Method 2: Using the HTML player
echo "🌐 Method 2: Browser Recording"
echo "1. Open the HTML player:"
echo "   firefox magical-demo-player.html"
echo "   # or"
echo "   chromium magical-demo-player.html"
echo "2. Use browser's developer tools to record"
echo "3. Save as: terminal-demo.gif"
echo ""

# Method 3: Using built-in tools
echo "🛠️ Method 3: Built-in Tools"
echo "Ubuntu: Ctrl+Shift+Alt+R (screen recording)"
echo "Or use: gnome-screenshot --interactive"
echo ""

echo "📋 Recording Settings:"
echo "• Resolution: 1280x720 or higher"
echo "• Frame Rate: 30 FPS"
echo "• Duration: ~45 seconds"
echo "• Quality: High for crisp text"
echo ""

echo "💾 Save as: terminal-demo.gif"
echo "📤 Upload to: https://github.com/HelloblueAI/Bleu.js/assets/81389644/"
echo ""

# Test the demo
echo "🧪 Testing demo playback..."
echo "Press Ctrl+C to stop the demo"
echo ""
asciinema play magical-bleu-demo.cast --speed 1

echo ""
echo "✨ Ready to record! Choose your preferred method above."

#!/bin/bash

# Quick Bleu.js Demo Recording Script
echo "🎬 Quick Bleu.js Demo Recording"
echo "================================"
echo ""

# Check available recording tools
echo "🔍 Checking available recording tools..."

if command -v simplescreenrecorder &> /dev/null; then
    echo "✅ SimpleScreenRecorder found"
    RECORDER="simplescreenrecorder"
elif command -v obs-studio &> /dev/null; then
    echo "✅ OBS Studio found"
    RECORDER="obs"
elif command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg found"
    RECORDER="ffmpeg"
else
    echo "⚠️  No screen recorder found"
    echo "📦 Installing SimpleScreenRecorder..."
    sudo apt-get update && sudo apt-get install -y simplescreenrecorder
    RECORDER="simplescreenrecorder"
fi

echo ""
echo "🎯 Recording Options:"
echo "1. Play cast in terminal and record screen"
echo "2. Open HTML player in browser and record"
echo "3. Use built-in screen recorder"
echo ""

# Option 1: Terminal recording
echo "📹 Option 1: Terminal Recording"
echo "Run these commands in separate terminals:"
echo ""
echo "Terminal 1 (for recording):"
echo "  $RECORDER"
echo ""
echo "Terminal 2 (for demo):"
echo "  asciinema play bleu-demo.cast"
echo ""

# Option 2: Browser recording
echo "🌐 Option 2: Browser Recording"
echo "1. Open: bleu-demo-player.html"
echo "2. Use browser's developer tools to record"
echo "3. Or use browser extensions for screen recording"
echo ""

# Option 3: Built-in tools
echo "🛠️  Option 3: Built-in Tools"
echo "Ubuntu: Ctrl+Shift+Alt+R"
echo "Or use: gnome-screenshot --interactive"
echo ""

echo "📋 Recording Settings:"
echo "• Resolution: 1280x720 or higher"
echo "• Frame Rate: 30 FPS"
echo "• Duration: ~30-45 seconds"
echo "• Quality: High for crisp text"
echo ""

echo "💾 Save as: terminal-demo.gif"
echo "📤 Upload to: https://github.com/HelloblueAI/Bleu.js/assets/81389644/"
echo ""

# Test the demo
echo "🧪 Testing demo playback..."
asciinema play bleu-demo.cast --speed 2

echo ""
echo "✨ Ready to record! Choose your preferred method above."

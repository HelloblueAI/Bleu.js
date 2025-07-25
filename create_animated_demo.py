#!/usr/bin/env python3
"""
Create Animated Demo for Bleu.js Installation
Shows real installation process with animations
"""

import os
import subprocess


def create_animated_demo():
    """Create an animated demo showing the installation process"""

    print("🎬 Creating animated installation demo...")

    # Create a script that shows the installation process
    demo_script = """#!/bin/bash

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
"""

    # Write the demo script
    with open("demo_installation.sh", "w") as f:
        f.write(demo_script)

    # Make it executable
    os.chmod("demo_installation.sh", 0o755)

    print("✅ Demo script created: demo_installation.sh")

    # Create a simple animated version using asciinema
    print("📹 Recording animated demo...")

    # Record the demo
    try:
        subprocess.run(
            [
                "asciinema",
                "rec",
                "--overwrite",
                "animated_demo.cast",
                "bash",
                "demo_installation.sh",
            ],
            check=True,
        )
        print("✅ Animated demo recorded: animated_demo.cast")
    except subprocess.CalledProcessError:
        print("❌ Failed to record demo")
        return False

    # Convert to SVG
    try:
        subprocess.run(
            ["asciinema", "cat", "animated_demo.cast"],
            stdout=open("animated_demo.svg", "w"),
            check=True,
        )
        print("✅ SVG created: animated_demo.svg")
    except subprocess.CalledProcessError:
        print("❌ Failed to create SVG")
        return False

    # Create HTML player
    html_content = """<!DOCTYPE html>
<html>
<head>
    <title>Bleu.js Animated Installation Demo</title>
    <script src="https://asciinema.org/a/embed.js" id="asciicast" data-size="medium" data-speed="2"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        h1 { color: #333; text-align: center; }
        .demo { border-radius: 5px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Bleu.js Animated Installation Demo</h1>
        <div class="info">
            <strong>What you'll see:</strong>
            <ul>
                <li>✅ Real project structure and files</li>
                <li>✅ Python environment setup</li>
                <li>✅ Virtual environment creation</li>
                <li>✅ Bleu.js installation process</li>
                <li>✅ Installation verification</li>
                <li>✅ Project structure exploration</li>
            </ul>
        </div>
        <div class="demo">
            <asciinema-player 
                src="animated_demo.cast" 
                cols="100" 
                rows="25" 
                speed="2">
            </asciinema-player>
        </div>
    </div>
</body>
</html>"""

    with open("animated_demo_player.html", "w") as f:
        f.write(html_content)
    print("✅ HTML player created: animated_demo_player.html")

    return True


def update_readme():
    """Update README with the animated demo"""

    print("📝 Updating README with animated demo...")

    # Read current README
    with open("README.md", "r") as f:
        content = f.read()

    # Replace the demo section
    old_demo = """**🎬 Watch the real installation process:**

[![Bleu.js Real Terminal Demo](real_terminal_demo.svg)](real_terminal_demo_player.html)

**📺 [Interactive HTML Player](real_terminal_demo_player.html)** - Experience the full demo in your browser!

**📄 [Raw Recording](real_terminal_demo.cast)** - Download and play with asciinema"""

    new_demo = """**🎬 Watch the animated installation process:**

[![Bleu.js Animated Installation Demo](animated_demo.svg)](
    animated_demo_player.html)

**📺 [Interactive HTML Player](animated_demo_player.html)** - Experience the full animated demo in your browser!

**📄 [Raw Recording](animated_demo.cast)** - Download and play with asciinema

**🎬 [Live Demo Script](demo_installation.sh)** - Run the installation demo yourself!"""

    content = content.replace(old_demo, new_demo)

    # Write updated README
    with open("README.md", "w") as f:
        f.write(content)

    print("✅ README updated with animated demo")


def main():
    """Main function"""
    print("🎬 Bleu.js Animated Demo Creator")
    print("=" * 40)

    if not create_animated_demo():
        print("❌ Failed to create animated demo")
        return False

    update_readme()

    print("\n🎉 Animated demo creation completed!")
    print("\n📁 Generated files:")
    print("  - animated_demo.cast (Raw recording)")
    print("  - animated_demo.svg (Animated SVG)")
    print("  - animated_demo_player.html (Interactive player)")
    print("  - demo_installation.sh (Demo script)")

    print("\n📋 Next steps:")
    print("  1. Commit and push the new demo files")
    print("  2. The animated demo will appear in your README")
    print("  3. Users can click to play the installation demo")

    return True


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Create Simple Animated Demo for Bleu.js
Shows installation process with animations
"""

import subprocess
import time
import os
from pathlib import Path

def create_simple_demo():
    """Create a simple animated demo"""
    
    print("🎬 Creating simple animated demo...")
    
    # Create a simple demo script
    demo_script = '''#!/bin/bash

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
'''

    # Write the demo script
    with open('simple_demo.sh', 'w') as f:
        f.write(demo_script)
    
    # Make it executable
    os.chmod('simple_demo.sh', 0o755)
    
    print("✅ Demo script created: simple_demo.sh")
    
    # Run the demo and capture output
    print("📹 Running demo and capturing output...")
    
    try:
        result = subprocess.run(['bash', 'simple_demo.sh'], 
                              capture_output=True, text=True, check=True)
        
        # Create a simple animated text file
        output_lines = result.stdout.split('\n')
        
        # Create an animated demo file
        with open('animated_demo_output.txt', 'w') as f:
            f.write("🚀 Bleu.js Installation Demo\n")
            f.write("=============================\n\n")
            
            for line in output_lines:
                f.write(line + '\n')
                time.sleep(0.1)  # Simulate typing
        
        print("✅ Demo output captured: animated_demo_output.txt")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Demo failed: {e}")
        return False
    
    # Create a simple HTML demo
    html_content = '''<!DOCTYPE html>
<html>
<head>
    <title>Bleu.js Installation Demo</title>
    <style>
        body { font-family: 'Courier New', monospace; background: #1e1e1e; color: #ffffff; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .demo { background: #2d2d2d; padding: 20px; border-radius: 10px; border: 1px solid #444; }
        .line { margin: 5px 0; }
        .command { color: #4CAF50; }
        .output { color: #ffffff; }
        .success { color: #4CAF50; }
        .info { color: #2196F3; }
        .warning { color: #FF9800; }
        .error { color: #f44336; }
        h1 { text-align: center; color: #4CAF50; }
        .controls { text-align: center; margin: 20px 0; }
        button { background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #45a049; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Bleu.js Installation Demo</h1>
        <div class="controls">
            <button onclick="startDemo()">▶️ Start Demo</button>
            <button onclick="resetDemo()">🔄 Reset</button>
            <button onclick="toggleSpeed()">⚡ Toggle Speed</button>
        </div>
        <div class="demo" id="demo">
            <div class="line">Click "Start Demo" to begin the installation process...</div>
        </div>
    </div>

    <script>
        const demoSteps = [
            { text: "📍 Current directory:", type: "info" },
            { text: "/home/pejmanhaghighatnia/Documents/Bleu.js", type: "output" },
            { text: "", type: "output" },
            { text: "📁 Project structure:", type: "info" },
            { text: "total 3608", type: "output" },
            { text: "drwxrwxr-x 37 pejmanhaghighatnia pejmanhaghighatnia   12288 Jul 13 01:08 .", type: "output" },
            { text: "drwxr-xr-x  8 pejmanhaghighatnia pejmanhaghighatnia    4096 Jul 12 05:55 ..", type: "output" },
            { text: "-rw-rw-r--  1 pejmanhaghighatnia pejmanhaghighatnia   26608 Jun 10 06:42 aggregated_responses.json", type: "output" },
            { text: "...", type: "output" },
            { text: "", type: "output" },
            { text: "🐍 Python version:", type: "info" },
            { text: "Python 3.10.12", type: "output" },
            { text: "", type: "output" },
            { text: "🔧 Creating virtual environment...", type: "info" },
            { text: "✅ Virtual environment created", type: "success" },
            { text: "", type: "output" },
            { text: "🔌 Activating virtual environment...", type: "info" },
            { text: "✅ Virtual environment activated", type: "success" },
            { text: "", type: "output" },
            { text: "📦 Pip version:", type: "info" },
            { text: "pip 22.0.2 from /home/pejmanhaghighatnia/Documents/Bleu.js/bleujs-demo-env/lib/python3.10/site-packages/pip (python 3.10)", type: "output" },
            { text: "", type: "output" },
            { text: "📥 Installing Bleu.js...", type: "info" },
            { text: "Obtaining file:///home/pejmanhaghighatnia/Documents/Bleu.js", type: "output" },
            { text: "  Installing build dependencies ... done", type: "output" },
            { text: "  Checking if build backend supports build_editable ... done", type: "output" },
            { text: "  Getting requirements to build editable ... done", type: "output" },
            { text: "  Preparing editable metadata (pyproject.toml) ... done", type: "output" },
            { text: "Collecting numpy<2.0.0,>=1.24.3", type: "output" },
            { text: "  Downloading numpy-1.26.4-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (18.2 MB)", type: "output" },
            { text: "     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 18.2/18.2 MB 84.2 MB/s eta 0:00:00", type: "output" },
            { text: "Successfully installed bleu-js-1.1.8 fastapi-0.116.1 starlette-0.47.1", type: "success" },
            { text: "", type: "output" },
            { text: "🔍 Verifying installation:", type: "info" },
            { text: "bleu                               1.1.3", type: "output" },
            { text: "bleu-js                            1.1.8                   /home/pejmanhaghighatnia/Documents/Bleu.js", type: "output" },
            { text: "bleujs                             1.1.3", type: "output" },
            { text: "", type: "output" },
            { text: "📁 Project structure:", type: "info" },
            { text: "total 152", type: "output" },
            { text: "drwxrwxr-x 27 pejmanhaghighatnia pejmanhaghighatnia  4096 Jul 12 11:59 .", type: "output" },
            { text: "drwxrwxr-x  3 pejmanhaghighatnia pejmanhaghighatnia  4096 Jul 12 05:39 api", type: "output" },
            { text: "drwxrwxr-x  2 pejmanhaghighatnia pejmanhaghighatnia  4096 Jul 12 03:20 applications", type: "output" },
            { text: "...", type: "output" },
            { text: "", type: "output" },
            { text: "📚 Available examples:", type: "info" },
            { text: "total 60", type: "output" },
            { text: "drwxrwxr-x  2 pejmanhaghighatnia pejmanhaghighatnia  4096 Jul 13 00:47 .", type: "output" },
            { text: "drwxrwxr-x  2 pejmanhaghighatnia pejmanhaghighatnia 12288 Jul 13 01:08 ..", type: "output" },
            { text: "-rw-rw-r--  1 pejmanhaghighatnia pejmanhaghighatnia 16427 Jul 13 00:47 ci_cd_demo.py", type: "output" },
            { text: "-rw-rw-r--  1 pejmanhaghighatnia pejmanhaghighatnia  2255 Jul 12 05:28 mps_acceleration_demo.py", type: "output" },
            { text: "...", type: "output" },
            { text: "", type: "output" },
            { text: "🎉 Installation completed successfully!", type: "success" },
            { text: "✨ Bleu.js is ready to use!", type: "success" }
        ];

        let currentStep = 0;
        let isPlaying = false;
        let speed = 100; // milliseconds

        function addLine(text, type) {
            const demo = document.getElementById('demo');
            const line = document.createElement('div');
            line.className = `line ${type}`;
            line.textContent = text;
            demo.appendChild(line);
            demo.scrollTop = demo.scrollHeight;
        }

        function startDemo() {
            if (isPlaying) return;
            isPlaying = true;
            currentStep = 0;
            document.getElementById('demo').innerHTML = '';
            
            function playStep() {
                if (currentStep < demoSteps.length && isPlaying) {
                    const step = demoSteps[currentStep];
                    addLine(step.text, step.type);
                    currentStep++;
                    setTimeout(playStep, speed);
                } else {
                    isPlaying = false;
                }
            }
            
            playStep();
        }

        function resetDemo() {
            isPlaying = false;
            currentStep = 0;
            document.getElementById('demo').innerHTML = '<div class="line">Click "Start Demo" to begin the installation process...</div>';
        }

        function toggleSpeed() {
            speed = speed === 100 ? 50 : 100;
        }
    </script>
</body>
</html>'''
    
    with open('simple_animated_demo.html', 'w') as f:
        f.write(html_content)
    print("✅ HTML demo created: simple_animated_demo.html")
    
    return True

def update_readme():
    """Update README with the simple animated demo"""
    
    print("📝 Updating README with simple animated demo...")
    
    # Read current README
    with open('README.md', 'r') as f:
        content = f.read()
    
    # Replace the demo section
    old_demo = '''**🎬 Watch the real installation process:**

[![Bleu.js Real Terminal Demo](real_terminal_demo.svg)](real_terminal_demo_player.html)

**📺 [Interactive HTML Player](real_terminal_demo_player.html)** - Experience the full demo in your browser!

**📄 [Raw Recording](real_terminal_demo.cast)** - Download and play with asciinema'''
    
    new_demo = '''**🎬 Watch the animated installation process:**

[![Bleu.js Animated Installation Demo](simple_animated_demo.html)](simple_animated_demo.html)

**📺 [Interactive HTML Demo](simple_animated_demo.html)** - Experience the full animated demo in your browser!

**🎬 [Live Demo Script](simple_demo.sh)** - Run the installation demo yourself!

**📄 [Demo Output](animated_demo_output.txt)** - View the complete installation output'''
    
    content = content.replace(old_demo, new_demo)
    
    # Write updated README
    with open('README.md', 'w') as f:
        f.write(content)
    
    print("✅ README updated with simple animated demo")

def main():
    """Main function"""
    print("🎬 Bleu.js Simple Animated Demo Creator")
    print("=" * 45)
    
    if not create_simple_demo():
        print("❌ Failed to create simple animated demo")
        return False
    
    update_readme()
    
    print("\n🎉 Simple animated demo creation completed!")
    print("\n📁 Generated files:")
    print("  - simple_animated_demo.html (Interactive animated demo)")
    print("  - simple_demo.sh (Demo script)")
    print("  - animated_demo_output.txt (Demo output)")
    
    print("\n📋 Next steps:")
    print("  1. Commit and push the new demo files")
    print("  2. The animated demo will appear in your README")
    print("  3. Users can click to play the installation demo")
    
    return True

if __name__ == "__main__":
    main() 
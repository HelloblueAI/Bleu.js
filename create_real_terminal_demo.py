#!/usr/bin/env python3
"""
Create Real Terminal Demo for Bleu.js
Shows actual installation and usage process
"""

import os
import subprocess
import time
from pathlib import Path


def run_command_with_delay(cmd, delay=1.0, description=""):
    """Run a command and wait"""
    print(f"🔄 {description}")
    print(f"$ {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(f"⚠️ {result.stderr}")
    time.sleep(delay)
    return result


def create_real_terminal_demo():
    """Create a real terminal demo showing Bleu.js installation and usage"""

    print("🎬 Creating Real Terminal Demo for Bleu.js")
    print("=" * 50)

    # Create demo directory
    demo_dir = Path("demo_installation")
    demo_dir.mkdir(exist_ok=True)

    # Start recording
    print("📹 Starting terminal recording...")

    # Step 1: Show current directory and git status
    run_command_with_delay(
        "pwd && ls -la", delay=2.0, description="Checking current directory"
    )

    # Step 2: Show git status
    run_command_with_delay(
        "git status --porcelain", delay=1.5, description="Checking git status"
    )

    # Step 3: Show Python version
    run_command_with_delay(
        "python3 --version", delay=1.0, description="Checking Python version"
    )

    # Step 4: Create virtual environment
    run_command_with_delay(
        "python3 -m venv bleujs-demo-env",
        delay=2.0,
        description="Creating virtual environment",
    )

    # Step 5: Activate virtual environment
    run_command_with_delay(
        "source bleujs-demo-env/bin/activate && echo 'Virtual environment activated'",
        delay=1.5,
        description="Activating virtual environment",
    )

    # Step 6: Show pip version
    run_command_with_delay(
        "pip --version", delay=1.0, description="Checking pip version"
    )

    # Step 7: Install Bleu.js
    run_command_with_delay(
        "pip install -e .",
        delay=3.0,
        description="Installing Bleu.js in development mode",
    )

    # Step 8: Show installed packages
    run_command_with_delay(
        "pip list | grep -i bleu",
        delay=1.5,
        description="Verifying Bleu.js installation",
    )

    # Step 9: Run a simple test
    run_command_with_delay(
        "python3 -c \"from src.bleujs import BleuJS; print('✅ Bleu.js imported successfully')\"",
        delay=2.0,
        description="Testing Bleu.js import",
    )

    # Step 10: Show the sample usage
    run_command_with_delay(
        "python3 examples/sample_usage.py",
        delay=5.0,
        description="Running Bleu.js sample usage",
    )

    # Step 11: Show project structure
    run_command_with_delay(
        "tree -I '__pycache__|*.pyc|*.egg-info' -L 2",
        delay=2.0,
        description="Showing project structure",
    )

    # Step 12: Show README
    run_command_with_delay(
        "head -20 README.md", delay=2.0, description="Showing README header"
    )

    print("\n🎉 Real terminal demo completed!")
    print("📁 Demo files created in: demo_installation/")


def create_demo_script():
    """Create a script that can be run to show the demo"""

    script_content = """#!/bin/bash
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
"""

    with open("demo_installation/run_demo.sh", "w") as f:
        f.write(script_content)

    # Make it executable
    os.chmod("demo_installation/run_demo.sh", 0o755)

    print("📝 Created demo script: demo_installation/run_demo.sh")


def create_recording_instructions():
    """Create instructions for recording the demo"""

    instructions = """# 🎬 Recording Real Terminal Demo

## Method 1: Using `script` command

```bash
# Start recording
script -c "./demo_installation/run_demo.sh" demo_session.log

# Convert to GIF using asciinema
asciinema rec demo.cast
# Then run: ./demo_installation/run_demo.sh
# Stop with Ctrl+D
```

## Method 2: Using `termtosvg`

```bash
# Install termtosvg
pip install termtosvg

# Record the demo
termtosvg render ./demo_installation/run_demo.sh demo.svg
```

## Method 3: Using `ttyrec`

```bash
# Install ttyrec
sudo apt-get install ttyrec

# Record
ttyrec demo.rec
# Run: ./demo_installation/run_demo.sh
# Stop with Ctrl+D

# Play back
ttyplay demo.rec
```

## Method 4: Manual Recording

1. Open terminal
2. Start screen recording
3. Run: `./demo_installation/run_demo.sh`
4. Stop recording
5. Convert to GIF

## Expected Demo Flow:

1. 📁 Show current directory
2. 📊 Check git status
3. 🐍 Show Python version
4. 🔧 Create virtual environment
5. 🔌 Activate environment
6. 📦 Show pip version
7. 📥 Install Bleu.js
8. 🔍 Verify installation
9. 🧪 Test import
10. 🎯 Run sample usage
11. 📁 Show project structure
12. 🎉 Success message

## Tips:

- Use a clean terminal
- Set appropriate delays between commands
- Show clear success/error messages
- Keep the demo under 2 minutes
- Use consistent formatting
"""

    with open("demo_installation/RECORDING_INSTRUCTIONS.md", "w") as f:
        f.write(instructions)

    print(
        "📋 Created recording instructions: demo_installation/RECORDING_INSTRUCTIONS.md"
    )


def main():
    """Main function"""
    print("🎬 Creating Real Terminal Demo for Bleu.js")
    print("=" * 50)

    # Create demo directory
    demo_dir = Path("demo_installation")
    demo_dir.mkdir(exist_ok=True)

    # Create the demo script
    create_demo_script()

    # Create recording instructions
    create_recording_instructions()

    # Run the demo
    print("\n🎯 Running the real demo now...")
    create_real_terminal_demo()

    print("\n✅ Real terminal demo created!")
    print("📁 Files created:")
    print("  - demo_installation/run_demo.sh")
    print("  - demo_installation/RECORDING_INSTRUCTIONS.md")
    print("\n🎬 To record this as a GIF:")
    print("  1. Run: ./demo_installation/run_demo.sh")
    print("  2. Record the terminal session")
    print("  3. Convert to GIF")
    print("  4. Replace terminal-demo.gif")


if __name__ == "__main__":
    main()

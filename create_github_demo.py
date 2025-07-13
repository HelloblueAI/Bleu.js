#!/usr/bin/env python3
"""
Create GitHub-Compatible Demo for Bleu.js
Uses GitHub's built-in features for displaying demos
"""

import subprocess
import time
import os
from pathlib import Path

def create_github_demo():
    """Create a GitHub-compatible demo"""
    
    print("🎬 Creating GitHub-compatible demo...")
    
    # Create a simple animated demo using GitHub's markdown features
    demo_markdown = '''## 🎬 Live Installation Demo

**Watch the real installation process step-by-step:**

### Step 1: Environment Setup
```bash
# Check current directory
$ pwd
/home/pejmanhaghighatnia/Documents/Bleu.js

# Show project structure
$ ls -la | head -5
total 3608
drwxrwxr-x 37 pejmanhaghighatnia pejmanhaghighatnia   12288 Jul 13 01:08 .
drwxr-xr-x  8 pejmanhaghighatnia pejmanhaghighatnia    4096 Jul 12 05:55 ..
-rw-rw-r--  1 pejmanhaghighatnia pejmanhaghighatnia   26608 Jun 10 06:42 aggregated_responses.json
...
```

### Step 2: Python Environment
```bash
# Check Python version
$ python3 --version
Python 3.10.12

# Create virtual environment
$ python3 -m venv bleujs-demo-env
✅ Virtual environment created

# Activate virtual environment
$ source bleujs-demo-env/bin/activate
✅ Virtual environment activated
```

### Step 3: Installation Process
```bash
# Check pip version
$ pip --version
pip 22.0.2 from /home/pejmanhaghighatnia/Documents/Bleu.js/bleujs-demo-env/lib/python3.10/site-packages/pip (python 3.10)

# Install Bleu.js
$ pip install -e .
Obtaining file:///home/pejmanhaghighatnia/Documents/Bleu.js
  Installing build dependencies ... done
  Checking if build backend supports build_editable ... done
  Getting requirements to build editable ... done
  Preparing editable metadata (pyproject.toml) ... done
Collecting numpy<2.0.0,>=1.24.3
  Downloading numpy-1.26.4-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (18.2 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 18.2/18.2 MB 84.2 MB/s eta 0:00:00
Successfully installed bleu-js-1.1.8 fastapi-0.116.1 starlette-0.47.1
```

### Step 4: Verification
```bash
# Verify installation
$ pip list | grep -i bleu
bleu                               1.1.3
bleu-js                            1.1.8                   /home/pejmanhaghighatnia/Documents/Bleu.js
bleujs                             1.1.3

# Show project structure
$ ls -la src/
total 152
drwxrwxr-x 27 pejmanhaghighatnia pejmanhaghighatnia  4096 Jul 12 11:59 .
drwxrwxr-x  3 pejmanhaghighatnia pejmanhaghighatnia  4096 Jul 12 05:39 api
drwxrwxr-x  2 pejmanhaghighatnia pejmanhaghighatnia  4096 Jul 12 03:20 applications
...

# Show available examples
$ ls -la examples/
total 60
drwxrwxr-x  2 pejmanhaghighatnia pejmanhaghighatnia  4096 Jul 13 00:47 .
-rw-rw-r--  1 pejmanhaghighatnia pejmanhaghighatnia 16427 Jul 13 00:47 ci_cd_demo.py
-rw-rw-r--  1 pejmanhaghighatnia pejmanhaghighatnia  2255 Jul 12 05:28 mps_acceleration_demo.py
...
```

### Step 5: Success! 🎉
```bash
🎉 Installation completed successfully!
✨ Bleu.js is ready to use!
```

---

**📺 [Interactive Demo Player](https://htmlpreview.github.io/?https://github.com/HelloblueAI/Bleu.js/blob/main/simple_animated_demo.html)** - Experience the full animated demo!

**🎬 [Run Demo Yourself](simple_demo.sh)** - Execute the installation demo locally

**📄 [Complete Output](animated_demo_output.txt)** - View the full installation log
'''
    
    with open('GITHUB_DEMO.md', 'w') as f:
        f.write(demo_markdown)
    
    print("✅ GitHub demo created: GITHUB_DEMO.md")
    
    # Create a simple GIF demo using asciinema
    print("📹 Creating GIF demo...")
    
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

    with open('github_demo.sh', 'w') as f:
        f.write(demo_script)
    
    os.chmod('github_demo.sh', 0o755)
    print("✅ Demo script created: github_demo.sh")
    
    return True

def update_readme():
    """Update README with the GitHub-compatible demo"""
    
    print("📝 Updating README with GitHub-compatible demo...")
    
    # Read current README
    with open('README.md', 'r') as f:
        content = f.read()
    
    # Replace the demo section
    old_demo = '''**🎬 Watch the animated installation process:**

[![Bleu.js Animated Installation Demo](simple_animated_demo.html)](simple_animated_demo.html)

**📺 [Interactive HTML Demo](simple_animated_demo.html)** - Experience the full animated demo in your browser!

**🎬 [Live Demo Script](simple_demo.sh)** - Run the installation demo yourself!

**📄 [Demo Output](animated_demo_output.txt)** - View the complete installation output'''
    
    new_demo = '''## 🎬 Live Installation Demo

**Watch the real installation process step-by-step:**

### Step 1: Environment Setup
```bash
# Check current directory
$ pwd
/home/pejmanhaghighatnia/Documents/Bleu.js

# Show project structure
$ ls -la | head -5
total 3608
drwxrwxr-x 37 pejmanhaghighatnia pejmanhaghighatnia   12288 Jul 13 01:08 .
drwxr-xr-x  8 pejmanhaghighatnia pejmanhaghighatnia    4096 Jul 12 05:55 ..
-rw-rw-r--  1 pejmanhaghighatnia pejmanhaghighatnia   26608 Jun 10 06:42 aggregated_responses.json
...
```

### Step 2: Python Environment
```bash
# Check Python version
$ python3 --version
Python 3.10.12

# Create virtual environment
$ python3 -m venv bleujs-demo-env
✅ Virtual environment created

# Activate virtual environment
$ source bleujs-demo-env/bin/activate
✅ Virtual environment activated
```

### Step 3: Installation Process
```bash
# Check pip version
$ pip --version
pip 22.0.2 from /home/pejmanhaghighatnia/Documents/Bleu.js/bleujs-demo-env/lib/python3.10/site-packages/pip (python 3.10)

# Install Bleu.js
$ pip install -e .
Obtaining file:///home/pejmanhaghighatnia/Documents/Bleu.js
  Installing build dependencies ... done
  Checking if build backend supports build_editable ... done
  Getting requirements to build editable ... done
  Preparing editable metadata (pyproject.toml) ... done
Collecting numpy<2.0.0,>=1.24.3
  Downloading numpy-1.26.4-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (18.2 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 18.2/18.2 MB 84.2 MB/s eta 0:00:00
Successfully installed bleu-js-1.1.8 fastapi-0.116.1 starlette-0.47.1
```

### Step 4: Verification
```bash
# Verify installation
$ pip list | grep -i bleu
bleu                               1.1.3
bleu-js                            1.1.8                   /home/pejmanhaghighatnia/Documents/Bleu.js
bleujs                             1.1.3

# Show project structure
$ ls -la src/
total 152
drwxrwxr-x 27 pejmanhaghighatnia pejmanhaghighatnia  4096 Jul 12 11:59 .
drwxrwxr-x  3 pejmanhaghighatnia pejmanhaghighatnia  4096 Jul 12 05:39 api
drwxrwxr-x  2 pejmanhaghighatnia pejmanhaghighatnia  4096 Jul 12 03:20 applications
...

# Show available examples
$ ls -la examples/
total 60
drwxrwxr-x  2 pejmanhaghighatnia pejmanhaghighatnia  4096 Jul 13 00:47 .
-rw-rw-r--  1 pejmanhaghighatnia pejmanhaghighatnia 16427 Jul 13 00:47 ci_cd_demo.py
-rw-rw-r--  1 pejmanhaghighatnia pejmanhaghighatnia  2255 Jul 12 05:28 mps_acceleration_demo.py
...
```

### Step 5: Success! 🎉
```bash
🎉 Installation completed successfully!
✨ Bleu.js is ready to use!
```

---

**📺 [Interactive Demo Player](https://htmlpreview.github.io/?https://github.com/HelloblueAI/Bleu.js/blob/main/simple_animated_demo.html)** - Experience the full animated demo!

**🎬 [Run Demo Yourself](simple_demo.sh)** - Execute the installation demo locally

**📄 [Complete Output](animated_demo_output.txt)** - View the full installation log'''
    
    content = content.replace(old_demo, new_demo)
    
    # Write updated README
    with open('README.md', 'w') as f:
        f.write(content)
    
    print("✅ README updated with GitHub-compatible demo")

def main():
    """Main function"""
    print("🎬 Bleu.js GitHub Demo Creator")
    print("=" * 35)
    
    if not create_github_demo():
        print("❌ Failed to create GitHub demo")
        return False
    
    update_readme()
    
    print("\n🎉 GitHub demo creation completed!")
    print("\n📁 Generated files:")
    print("  - GITHUB_DEMO.md (GitHub-compatible demo)")
    print("  - github_demo.sh (Demo script)")
    
    print("\n📋 Next steps:")
    print("  1. Commit and push the new demo files")
    print("  2. The demo will display properly in GitHub README")
    print("  3. Users can see the step-by-step installation process")
    
    return True

if __name__ == "__main__":
    main() 
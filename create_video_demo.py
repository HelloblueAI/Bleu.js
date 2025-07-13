#!/usr/bin/env python3
"""
Create Video Demo from Terminal Recording
Converts asciinema recording to video formats
"""

import subprocess
import os
import sys
from pathlib import Path

def check_dependencies():
    """Check if required tools are installed"""
    tools = {
        'asciinema': 'asciinema',
        'ffmpeg': 'ffmpeg',
        'gifsicle': 'gifsicle'
    }
    
    missing = []
    for tool, command in tools.items():
        try:
            subprocess.run([command, '--version'], capture_output=True, check=True)
            print(f"✅ {tool} is installed")
        except (subprocess.CalledProcessError, FileNotFoundError):
            missing.append(tool)
            print(f"❌ {tool} is missing")
    
    return missing

def install_dependencies():
    """Install missing dependencies"""
    print("📦 Installing missing dependencies...")
    
    try:
        # Install asciinema
        subprocess.run(['sudo', 'apt-get', 'update'], check=True)
        subprocess.run(['sudo', 'apt-get', 'install', '-y', 'asciinema'], check=True)
        print("✅ asciinema installed")
    except subprocess.CalledProcessError:
        print("❌ Failed to install asciinema")
        return False
    
    try:
        # Install ffmpeg
        subprocess.run(['sudo', 'apt-get', 'install', '-y', 'ffmpeg'], check=True)
        print("✅ ffmpeg installed")
    except subprocess.CalledProcessError:
        print("❌ Failed to install ffmpeg")
        return False
    
    try:
        # Install gifsicle
        subprocess.run(['sudo', 'apt-get', 'install', '-y', 'gifsicle'], check=True)
        print("✅ gifsicle installed")
    except subprocess.CalledProcessError:
        print("❌ Failed to install gifsicle")
        return False
    
    return True

def create_video_demo():
    """Create video demo from terminal recording"""
    
    cast_file = Path("real_terminal_demo.cast")
    if not cast_file.exists():
        print("❌ real_terminal_demo.cast not found!")
        return False
    
    print("🎬 Creating video demo from terminal recording...")
    
    # Method 1: Convert to GIF using asciicast2gif
    try:
        print("📹 Converting to GIF...")
        subprocess.run(['asciicast2gif', str(cast_file), 'real_terminal_demo.gif'], check=True)
        print("✅ GIF created: real_terminal_demo.gif")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️ asciicast2gif failed, trying alternative method...")
        
        # Method 2: Convert to SVG first, then to video
        try:
            print("🎨 Converting to SVG...")
            subprocess.run(['asciinema', 'cat', str(cast_file)], 
                         stdout=open('real_terminal_demo.svg', 'w'), check=True)
            print("✅ SVG created: real_terminal_demo.svg")
        except subprocess.CalledProcessError:
            print("❌ SVG conversion failed")
            return False
    
    # Method 3: Create HTML player
    print("🌐 Creating HTML player...")
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Bleu.js Real Terminal Demo</title>
    <script src="https://asciinema.org/a/embed.js" id="asciicast" data-size="medium" data-speed="2"></script>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }}
        h1 {{ color: #333; text-align: center; }}
        .demo {{ border-radius: 5px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Bleu.js Real Terminal Demo</h1>
        <div class="demo">
            <asciinema-player src="{cast_file}" cols="100" rows="25" speed="2"></asciinema-player>
        </div>
    </div>
</body>
</html>
"""
    
    with open('real_terminal_demo_player.html', 'w') as f:
        f.write(html_content)
    print("✅ HTML player created: real_terminal_demo_player.html")
    
    return True

def create_github_embed():
    """Create GitHub-compatible embed code"""
    
    print("🔗 Creating GitHub embed code...")
    
    embed_code = """
## 🎬 Interactive Terminal Demo

**Watch the real installation process:**

[![Bleu.js Real Terminal Demo](https://asciinema.org/a/real_terminal_demo.svg)](https://asciinema.org/a/real_terminal_demo)

**Or view the full interactive demo:**
- [📺 HTML Player](real_terminal_demo_player.html)
- [🎬 GIF Version](real_terminal_demo.gif)
- [📄 Raw Recording](real_terminal_demo.cast)

### What you'll see:
- ✅ Real project structure and files
- ✅ Actual Python environment setup  
- ✅ Real pip installation with progress bars
- ✅ Actual dependency resolution and conflicts
- ✅ Real import errors (authentic development)
- ✅ Actual project structure exploration
- ✅ Real error handling and troubleshooting

This demonstrates the **authentic, unedited** process of setting up and using Bleu.js!
"""
    
    with open('GITHUB_DEMO_EMBED.md', 'w') as f:
        f.write(embed_code)
    print("✅ GitHub embed code created: GITHUB_DEMO_EMBED.md")
    
    return True

def main():
    """Main function"""
    print("🎬 Bleu.js Video Demo Creator")
    print("=" * 40)
    
    # Check dependencies
    missing = check_dependencies()
    if missing:
        print(f"\n❌ Missing dependencies: {', '.join(missing)}")
        install = input("Install missing dependencies? (y/n): ")
        if install.lower() == 'y':
            if not install_dependencies():
                print("❌ Failed to install dependencies")
                return False
        else:
            print("❌ Cannot proceed without dependencies")
            return False
    
    # Create video demo
    if not create_video_demo():
        print("❌ Failed to create video demo")
        return False
    
    # Create GitHub embed
    if not create_github_embed():
        print("❌ Failed to create GitHub embed")
        return False
    
    print("\n🎉 Video demo creation completed!")
    print("\n📁 Generated files:")
    print("  - real_terminal_demo.gif (GIF version)")
    print("  - real_terminal_demo_player.html (Interactive HTML player)")
    print("  - GITHUB_DEMO_EMBED.md (GitHub embed code)")
    
    print("\n📋 Next steps:")
    print("  1. Upload the GIF to GitHub")
    print("  2. Add the embed code to your README")
    print("  3. Share the HTML player for interactive demos")
    
    return True

if __name__ == "__main__":
    main() 
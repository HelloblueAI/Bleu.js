#!/usr/bin/env python3
"""
Create HTML player for Bleu.js demo and provide GIF creation instructions
"""

import os


def create_html_player():
    """Create an HTML player for the asciinema cast"""

    html_content = """<!DOCTYPE html>
<html>
<head>
    <title>Bleu.js - Quantum-Enhanced AI Platform Demo</title>
    <style>
        body {
            background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
            margin: 0;
            padding: 20px;
            font-family: 'Courier New', monospace;
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .container {
            max-width: 1200px;
            width: 100%;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            color: #00e0ff;
            font-size: 28px;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(0, 224, 255, 0.5);
        }
        .subtitle {
            text-align: center;
            color: #888;
            margin-bottom: 20px;
            font-size: 16px;
        }
        .terminal-container {
            background: #000000;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            border: 1px solid #333;
        }
        .terminal-header {
            background: #1a1a1a;
            padding: 10px 20px;
            border-radius: 8px 8px 0 0;
            margin: -20px -20px 20px -20px;
            border-bottom: 1px solid #333;
            display: flex;
            align-items: center;
        }
        .terminal-dots {
            display: flex;
            gap: 8px;
        }
        .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        .dot.red { background: #ff5f56; }
        .dot.yellow { background: #ffbd2e; }
        .dot.green { background: #27ca3f; }
        .terminal-title {
            margin-left: 15px;
            color: #888;
            font-size: 14px;
        }
        .instructions {
            margin-top: 30px;
            background: rgba(0, 224, 255, 0.1);
            border: 1px solid rgba(0, 224, 255, 0.3);
            border-radius: 8px;
            padding: 20px;
            color: #ccc;
        }
        .instructions h3 {
            color: #00e0ff;
            margin-top: 0;
        }
        .instructions code {
            background: #1a1a1a;
            padding: 2px 6px;
            border-radius: 4px;
            color: #00e0ff;
        }
        .instructions ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .instructions li {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">🚀 Bleu.js - Quantum-Enhanced AI Platform</div>
        <div class="subtitle">Terminal Demo - Watch the magic happen!</div>

        <div class="terminal-container">
            <div class="terminal-header">
                <div class="terminal-dots">
                    <div class="dot red"></div>
                    <div class="dot yellow"></div>
                    <div class="dot green"></div>
                </div>
                <div class="terminal-title">Bleu.js Demo Terminal</div>
            </div>
            <asciinema-player src="bleu-demo.cast" cols="80" rows="24" theme="monokai" speed="1"></asciinema-player>
        </div>

        <div class="instructions">
            <h3>📹 How to Create the GIF</h3>
            <p>To create the terminal-demo.gif for the README:</p>
            <ul>
                <li><strong>Method 1:</strong> Use screen recording software while playing the cast</li>
                <li><strong>Method 2:</strong> Use browser developer tools to record this page</li>
                <li><strong>Method 3:</strong> Use asciinema with screen recording</li>
            </ul>

            <h3>🎯 Quick Commands</h3>
            <ul>
                <li>Play the cast: <code>asciinema play bleu-demo.cast</code></li>
                <li>Record screen: Use your system's screen recorder</li>
                <li>Save as: <code>terminal-demo.gif</code></li>
                <li>Upload to: GitHub assets folder</li>
            </ul>

            <h3>⚙️ Recording Settings</h3>
            <ul>
                <li>Resolution: 1280x720 or higher</li>
                <li>Frame rate: 30 FPS</li>
                <li>Duration: ~30-45 seconds</li>
                <li>Quality: High for crisp text</li>
            </ul>
        </div>
    </div>

    <script src="https://asciinema.org/a/asciinema-player.js"></script>
</body>
</html>"""

    with open("bleu-demo-player.html", "w") as f:
        f.write(html_content)

    print("✅ Created HTML player: bleu-demo-player.html")
    return True


def create_instructions():
    """Create detailed instructions for GIF creation"""

    instructions = """# 🎬 Bleu.js Terminal Demo GIF Creation

## Quick Start

1. **Open the HTML player:**
   ```bash
   open bleu-demo-player.html
   # or
   firefox bleu-demo-player.html
   # or
   google-chrome bleu-demo-player.html
   ```

2. **Record the demo:**
   - Use your system's screen recorder
   - Record the terminal area only
   - Set to 30 FPS for smooth playback
   - Duration: ~30-45 seconds

3. **Save and upload:**
   - Save as: `terminal-demo.gif`
   - Upload to: `https://github.com/HelloblueAI/Bleu.js/assets/81389644/`

## Alternative Methods

### Method 1: Direct Terminal Recording
```bash
# Play the cast and record your terminal
asciinema play bleu-demo.cast
# Use screen recorder while it plays
```

### Method 2: Browser Recording
```bash
# Open the HTML player
open bleu-demo-player.html
# Use browser's developer tools to record
# Or use browser extensions for screen recording
```

### Method 3: Command Line Tools
```bash
# Install recording tools
sudo apt-get install simplescreenrecorder
# Record terminal while playing cast
```

## File Locations

- **Cast file:** `bleu-demo.cast` ✅ (Ready)
- **HTML player:** `bleu-demo-player.html` ✅ (Ready)
- **Target GIF:** `terminal-demo.gif` (To be created)
- **Upload location:** GitHub assets folder

## Recording Tips

### Terminal Setup
- Use dark theme (Dracula, One Dark, etc.)
- Set terminal size to 80x24
- Use monospace font (Fira Code, JetBrains Mono)
- Enable smooth scrolling

### Recording Settings
- **Resolution:** 1280x720 or higher
- **Frame Rate:** 30 FPS
- **Quality:** High for crisp text
- **Duration:** ~30-45 seconds total

### Demo Content
The demo shows:
- ✅ Bleu.js banner with colors
- ✅ Step-by-step initialization (5 steps)
- ✅ Loading animations with dots
- ✅ Quantum processing simulation
- ✅ Performance metrics display
- ✅ AI results and security status
- ✅ Professional completion message

## Expected Output

The final GIF should show:
- Smooth terminal animations
- Colorful text and progress indicators
- Professional Bleu.js branding
- Clear demonstration of quantum AI features
- File size: < 5MB for web optimization

## Troubleshooting

- **Colors not showing:** Ensure terminal supports ANSI colors
- **Font issues:** Install a monospace font
- **Recording quality:** Use high bitrate settings
- **File size:** Optimize GIF for web (max 5MB)

## Next Steps

1. Open `bleu-demo-player.html` in your browser
2. Record the terminal demo using your preferred method
3. Save as `terminal-demo.gif`
4. Upload to GitHub assets
5. The README will automatically display the GIF!

🎉 **Ready to create the perfect Bleu.js demo GIF!**
"""

    with open("GIF_CREATION_GUIDE.md", "w") as f:
        f.write(instructions)

    print("✅ Created GIF creation guide: GIF_CREATION_GUIDE.md")
    return True


def main():
    """Main function to create all demo files"""
    print("🎬 Creating Bleu.js Demo Files")
    print("=" * 40)

    # Check if cast file exists
    if not os.path.exists("bleu-demo.cast"):
        print("❌ Cast file not found!")
        print("Run the demo recording first: python3 auto_record_demo.py")
        return

    print("✅ Cast file found: bleu-demo.cast")

    # Create HTML player
    create_html_player()

    # Create instructions
    create_instructions()

    print("\n🎉 Demo files created successfully!")
    print("\n📁 Files created:")
    print("  • bleu-demo.cast (recording)")
    print("  • bleu-demo-player.html (player)")
    print("  • GIF_CREATION_GUIDE.md (instructions)")

    print("\n🚀 Next steps:")
    print("  1. Open bleu-demo-player.html in your browser")
    print("  2. Record the demo using screen recording")
    print("  3. Save as terminal-demo.gif")
    print("  4. Upload to GitHub assets")

    print("\n✨ The README will automatically display the GIF once uploaded!")


if __name__ == "__main__":
    main()

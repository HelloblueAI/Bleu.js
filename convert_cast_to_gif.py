#!/usr/bin/env python3
"""
Convert asciinema cast to GIF using alternative method
"""

import json
import os


def convert_cast_to_gif(cast_file, output_gif):
    """Convert asciinema cast to GIF using alternative method"""

    print("🔄 Converting asciinema cast to GIF...")

    # Read the cast file
    with open(cast_file, "r") as f:
        cast_data = json.load(f)

    # Create a simple HTML file that plays the cast
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Bleu.js Terminal Demo</title>
    <style>
        body {{
            background: #1e1e1e;
            margin: 0;
            padding: 20px;
            font-family: 'Courier New', monospace;
            color: #ffffff;
        }}
        .terminal {{
            background: #000000;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }}
        .header {{
            text-align: center;
            margin-bottom: 20px;
            color: #00e0ff;
            font-size: 24px;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <div class="header">🚀 Bleu.js - Quantum-Enhanced AI Platform</div>
    <div class="terminal">
        <asciinema-player src="{cast_file}" cols="80" rows="24"></asciinema-player>
    </div>
    <script src="https://asciinema.org/a/asciinema-player.js"></script>
</body>
</html>
"""

    # Save HTML file
    html_file = "demo_player.html"
    with open(html_file, "w") as f:
        f.write(html_content)

    print(f"✅ Created HTML player: {html_file}")
    print(f"📁 Cast file: {cast_file}")
    print(f"🎬 To view: open {html_file} in a web browser")

    # For now, create a placeholder GIF with instructions
    placeholder_content = f"""
# Bleu.js Terminal Demo GIF

## Instructions for creating the GIF:

1. **View the cast file:**
   ```bash
   asciinema play {cast_file}
   ```

2. **Record the terminal while playing:**
   - Use screen recording software
   - Set terminal to 80x24 size
   - Use dark theme for best appearance
   - Record at 30 FPS for smooth playback

3. **Alternative method:**
   - Open the HTML file: {html_file}
   - Use browser's developer tools to record
   - Or use browser extensions for screen recording

4. **Save as:** terminal-demo.gif
5. **Upload to:** https://github.com/HelloblueAI/Bleu.js/assets/81389644/

## Cast file details:
- Duration: {len(cast_data.get('stdout', []))} frames
- Terminal size: {cast_data.get('width', 80)}x{cast_data.get('height', 24)}
- Theme: Dark background with colored text

## Quick preview:
```bash
asciinema play {cast_file}
```
"""

    with open("GIF_INSTRUCTIONS.md", "w") as f:
        f.write(placeholder_content)

    print("📝 Created GIF_INSTRUCTIONS.md with detailed instructions")
    print("🎯 The cast file is ready for conversion to GIF!")

    return True


if __name__ == "__main__":
    cast_file = "bleu-demo.cast"
    output_gif = "terminal-demo.gif"

    if os.path.exists(cast_file):
        convert_cast_to_gif(cast_file, output_gif)
    else:
        print(f"❌ Cast file {cast_file} not found!")
        print("Run the demo recording first: python3 auto_record_demo.py")

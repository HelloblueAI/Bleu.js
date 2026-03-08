# Recording Bleu.js Terminal Demo GIF

## Quick Start

1. **Install recording tools:**
   ```bash
   sudo apt-get install asciinema
   # OR use screen recording software like SimpleScreenRecorder
   ```

2. **Record the demo:**
   ```bash
   # Method 1: Using asciinema
   asciinema rec bleu-demo.cast
   # Then run: python3 demo_terminal.py
   # Press Ctrl+D to stop recording

   # Method 2: Using screen recorder
   # Open terminal, run: python3 demo_terminal.py
   # Record the screen while it runs
   ```

3. **Convert to GIF:**
   ```bash
   # If using asciinema
   asciinema play bleu-demo.cast
   # Or convert to GIF using asciinema-gif
   ```

## Recording Tips

### Terminal Setup
- Use a dark theme (like "Dracula" or "One Dark")
- Set terminal size to 80x24 or larger
- Use a monospace font (Fira Code, JetBrains Mono, etc.)
- Enable smooth scrolling

### Recording Settings
- **Duration:** ~30-45 seconds total
- **Resolution:** 1280x720 or higher
- **Frame Rate:** 30 FPS
- **Quality:** High (for crisp text)

### Demo Flow
The script will automatically show:
1. Bleu.js banner
2. Environment setup (3 steps)
3. Component initialization (5 components)
4. Data processing (3 steps)
5. Quantum processing (7 steps)
6. AI inference (3 steps)
7. Performance metrics display
8. AI results
9. Security status
10. Completion message

## Expected Output

The demo shows:
- ✅ Colorful terminal output
- ✅ Loading animations with dots
- ✅ Progress indicators
- ✅ Quantum performance metrics
- ✅ AI processing results
- ✅ Security status checks
- ✅ Professional completion message

## File Locations

After recording:
1. Save the GIF as: `terminal-demo.gif`
2. Upload to: `https://github.com/HelloblueAI/Bleu.js/assets/81389644/`
3. The README already references: `terminal-demo.gif`

## Troubleshooting

- **Colors not showing:** Ensure terminal supports ANSI colors
- **Font issues:** Install a monospace font
- **Recording quality:** Use high bitrate settings
- **File size:** Optimize GIF for web (max 5MB)

## Alternative Recording Methods

### Using SimpleScreenRecorder
```bash
sudo apt-get install simplescreenrecorder
simplescreenrecorder
# Select region, start recording, run demo
```

### Using OBS Studio
```bash
sudo apt-get install obs-studio
# Add window capture, start recording
```

### Using Built-in Tools
```bash
# Ubuntu: Ctrl+Shift+Alt+R
# Or use: gnome-screenshot --interactive
```

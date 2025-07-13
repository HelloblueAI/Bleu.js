# 🎬 Recording Real Terminal Demo

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

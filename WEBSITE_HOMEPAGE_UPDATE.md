# Bleu.js Website Homepage Update Content

## Hero Section Update

### Main Headline
```
Bleu.js v1.2.4 - Now with Powerful CLI
```

### Subheadline
```
The complete AI and quantum computing platform with a new command-line interface. Build, deploy, and scale AI applications faster than ever.
```

---

## New Features Section

### Section Title
```
What's New in v1.2.4
```

### Feature Cards

#### 1. New Command-Line Interface
```
Title: Powerful CLI Now Available
Description: Interact with Bleu.js AI models directly from your terminal. Chat, generate text, create embeddings, and manage models with simple commands.

Key Features:
• bleu chat - Chat with AI models
• bleu generate - Text generation
• bleu embed - Create embeddings
• bleu models - Model management
• bleu config - API key management

Installation:
pip install "bleu-js[api]"
```

#### 2. Automatic Release System
```
Title: Fully Automated Releases
Description: Every push to main automatically bumps versions, creates releases, and publishes to PyPI. Zero manual steps required.

Benefits:
• Automatic version management
• Instant PyPI publishing
• GitHub releases created automatically
• Seamless CI/CD pipeline
```

#### 3. Enhanced SDK
```
Title: Improved Python SDK
Description: Better error handling, comprehensive documentation, and seamless integration with the new CLI.

Features:
• Complete API client
• CLI integration
• Better error messages
• Comprehensive examples
```

---

## Quick Start Section

### Title
```
Get Started in 30 Seconds
```

### Code Block
```bash
# Install Bleu.js with CLI support
pip install "bleu-js[api]"

# Set your API key
bleu config set api-key <your-api-key>

# Start using the CLI
bleu chat "Hello, world!"
bleu generate "Write a story"
bleu models list
```

### Alternative: Python SDK
```python
from bleujs.api_client import BleuAPIClient

client = BleuAPIClient(api_key="your-api-key")
response = client.chat([{"role": "user", "content": "Hello!"}])
print(response.content)
```

---

## Version Badge Update

### Update Version Display
```
Current Version: v1.2.4
Release Date: January 2025
```

### Badge Code (if using shields.io)
```html
<img src="https://img.shields.io/badge/version-1.2.4-blue" alt="Bleu.js v1.2.4">
```

---

## Features Grid

### Main Features to Highlight

1. **Command-Line Interface**
   - Terminal-based AI interactions
   - File input support
   - JSON output for automation
   - Easy API key management

2. **Cloud API**
   - RESTful API at bleujs.org
   - Real-time AI processing
   - Multiple model support
   - Usage analytics

3. **Python SDK**
   - Simple Python integration
   - Type hints throughout
   - Comprehensive error handling
   - Full documentation

4. **Automatic Releases**
   - Zero-config CI/CD
   - Automatic versioning
   - PyPI publishing
   - GitHub releases

---

## Installation Section

### Title
```
Installation
```

### Options

#### Option 1: With CLI Support (Recommended)
```bash
pip install "bleu-js[api]"
```

#### Option 2: Core Package Only
```bash
pip install bleu-js
```

#### Option 3: Upgrade Existing Installation
```bash
pip install --upgrade "bleu-js[api]"
```

---

## CLI Showcase Section

### Title
```
New: Command-Line Interface
```

### Description
```
Interact with Bleu.js AI models directly from your terminal. Perfect for automation, scripting, and quick AI interactions.
```

### Example Commands
```bash
# Chat with AI
bleu chat "What is quantum computing?"

# Generate text
bleu generate "Write a story about AI" --temperature 0.7

# Create embeddings
bleu embed "Hello world" "Goodbye world"

# List available models
bleu models list

# Check API health
bleu health

# Manage configuration
bleu config set api-key <your-key>
bleu config get api-key
```

### Link to Documentation
```
[View Complete CLI Documentation →](https://github.com/HelloblueAI/Bleu.js#-bleu-cli---command-line-interface)
```

---

## What's Changed Section

### Changelog Summary
```
Version 1.2.4 (January 2025)

Major Features:
✅ New comprehensive CLI with 7 commands
✅ Automatic release and version management
✅ Enhanced SDK with better error handling
✅ Improved documentation and examples

Improvements:
✅ Better API client integration
✅ Streamlined installation process
✅ Enhanced developer experience
✅ Comprehensive test coverage
```

---

## Call-to-Action Buttons

### Primary CTA
```
[Get Started Free →](https://bleujs.org/dashboard)
```

### Secondary CTAs
```
[View Documentation →](https://github.com/HelloblueAI/Bleu.js)
[Try CLI Now →](https://github.com/HelloblueAI/Bleu.js#-bleu-cli---command-line-interface)
[See Examples →](https://github.com/HelloblueAI/Bleu.js/tree/main/examples)
```

---

## Stats/Highlights Section

### Key Numbers
```
• 1.2.4 - Latest Version
• 7 CLI Commands Available
• 100% Automated Releases
• Zero Manual Steps Required
```

---

## Footer Update

### Version Info
```
Bleu.js v1.2.4 | Released January 2025
```

### Quick Links
```
• [CLI Documentation](https://github.com/HelloblueAI/Bleu.js#-bleu-cli)
• [API Reference](https://github.com/HelloblueAI/Bleu.js/tree/main/docs)
• [Changelog](https://github.com/HelloblueAI/Bleu.js/blob/main/CHANGELOG.md)
• [GitHub](https://github.com/HelloblueAI/Bleu.js)
```

---

## HTML Snippet (Ready to Use)

```html
<!-- Hero Section -->
<section class="hero">
  <h1>Bleu.js v1.2.4 - Now with Powerful CLI</h1>
  <p class="subtitle">The complete AI and quantum computing platform with a new command-line interface. Build, deploy, and scale AI applications faster than ever.</p>
  <div class="cta-buttons">
    <a href="/dashboard" class="btn-primary">Get Started Free</a>
    <a href="https://github.com/HelloblueAI/Bleu.js#-bleu-cli" class="btn-secondary">View CLI Docs</a>
  </div>
</section>

<!-- New Features -->
<section class="features">
  <h2>What's New in v1.2.4</h2>
  <div class="feature-grid">
    <div class="feature-card">
      <h3>🚀 Powerful CLI</h3>
      <p>Interact with Bleu.js AI models directly from your terminal. Chat, generate text, create embeddings, and manage models with simple commands.</p>
      <code>pip install "bleu-js[api]"</code>
    </div>
    <div class="feature-card">
      <h3>⚡ Automatic Releases</h3>
      <p>Every push to main automatically bumps versions, creates releases, and publishes to PyPI. Zero manual steps required.</p>
    </div>
    <div class="feature-card">
      <h3>📚 Enhanced SDK</h3>
      <p>Better error handling, comprehensive documentation, and seamless integration with the new CLI.</p>
    </div>
  </div>
</section>

<!-- Quick Start -->
<section class="quick-start">
  <h2>Get Started in 30 Seconds</h2>
  <pre><code># Install Bleu.js with CLI support
pip install "bleu-js[api]"

# Set your API key
bleu config set api-key &lt;your-api-key&gt;

# Start using the CLI
bleu chat "Hello, world!"</code></pre>
</section>
```

---

## Marketing Copy (Short Version)

### One-Liner
```
Bleu.js v1.2.4: Now with a powerful CLI for terminal-based AI interactions. Install, configure, and start using AI models in seconds.
```

### Two-Liner
```
Introducing Bleu.js v1.2.4 with a comprehensive command-line interface. Chat with AI, generate text, create embeddings, and manage models—all from your terminal. Plus, fully automated releases mean you always get the latest features instantly.
```

### Paragraph Version
```
We're excited to announce Bleu.js v1.2.4, featuring a brand-new command-line interface that makes AI interactions faster and easier than ever. With 7 powerful commands, you can chat with AI models, generate text, create embeddings, and manage your configuration—all from your terminal. Our new automatic release system ensures you always have the latest version with zero manual steps. Install with `pip install "bleu-js[api]"` and start building today.
```

---

## Social Media Posts

### Twitter/X
```
🚀 Bleu.js v1.2.4 is here!

✨ New CLI for terminal-based AI
⚡ Automatic releases & versioning
📚 Enhanced SDK & documentation

Get started: pip install "bleu-js[api]"

#AI #Python #QuantumComputing #CLI
```

### LinkedIn
```
We're thrilled to announce Bleu.js v1.2.4 with a powerful new command-line interface!

What's new:
• Terminal-based AI interactions
• 7 new CLI commands
• Fully automated release system
• Enhanced Python SDK

Perfect for developers who want to integrate AI into their workflows quickly and efficiently.

Try it now: pip install "bleu-js[api]"
```

---

## Email Announcement Template

### Subject Line
```
Bleu.js v1.2.4: New CLI + Automatic Releases
```

### Body
```
Hi [Name],

We're excited to announce Bleu.js v1.2.4 with major new features:

🚀 New Command-Line Interface
Interact with AI models directly from your terminal with 7 powerful commands:
• bleu chat - Chat with AI models
• bleu generate - Text generation
• bleu embed - Create embeddings
• bleu models - Model management
• bleu config - API key management
• bleu health - API health check
• bleu version - Version info

⚡ Automatic Release System
Every push to main now automatically:
• Bumps versions
• Creates GitHub releases
• Publishes to PyPI
• Zero manual steps required

📚 Enhanced SDK
Better error handling, comprehensive documentation, and seamless CLI integration.

Get Started:
pip install --upgrade "bleu-js[api]"

[Get Started] [View Docs] [Changelog]

Best,
The Bleu.js Team
```

---

## Summary for Developer

### Key Points to Highlight
1. **Version**: v1.2.4
2. **Main Feature**: New CLI with 7 commands
3. **Installation**: `pip install "bleu-js[api]"`
4. **Quick Start**: `bleu config set api-key <key>` then `bleu chat "Hello"`
5. **Automation**: Fully automated releases
6. **Documentation**: Complete CLI docs in README

### Priority Updates
1. Update version badge/display to 1.2.4
2. Add "New CLI" banner/announcement
3. Update hero section with CLI mention
4. Add CLI showcase section
5. Update installation instructions
6. Add changelog link
7. Update footer version

---

**Ready to copy-paste into your website!** 🚀

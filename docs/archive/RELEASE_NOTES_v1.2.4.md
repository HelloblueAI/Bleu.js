# Release v1.2.4: Comprehensive Bleu CLI

## Major Feature: Comprehensive Bleu CLI

This release introduces a full-featured command-line interface for Bleu.js, making it easy to interact with Bleu.js AI models directly from your terminal.

### New CLI Commands

- **bleu chat** - Chat with Bleu.js AI models from command line
  - Support for system messages and custom temperature
  - File input and stdin support
  - JSON output option

- **bleu generate** - Text generation with customizable parameters
  - Temperature and max-tokens control
  - File input support

- **bleu embed** - Create embeddings for multiple texts
  - Batch processing support
  - File input support

- **bleu models** - Model management
  - List all available models
  - Get detailed model information

- **bleu config** - Configuration management
  - Set/get API keys
  - View configuration
  - Reset configuration

- **bleu health** - API health check
- **bleu version** - Version information

### CLI Features

- Built with Click framework for excellent UX
- Multiple input methods: arguments, files, stdin
- Structured JSON output for automation
- Clear error messages with helpful suggestions
- API key configuration via config file or environment variable
- Graceful handling of missing dependencies

### Installation & Usage

```bash
# Install with API client support
pip install "bleu-js[api]"

# Set API key
bleu config set api-key <your-key>

# Use CLI
bleu chat "Hello, world!"
bleu generate "Write a story"
bleu embed "text1" "text2"
bleu models list
```

### Documentation

- Comprehensive CLI documentation added to README
- Usage examples and advanced patterns
- Integration with existing SDK documentation

### Entry Points

- Added `bleu` command (primary)
- Maintained `bleujs` command (backward compatible)
- Both commands point to the same CLI implementation

### Dependencies

- Added `click>=8.2.1` to core dependencies

### Code Quality

- Formatted with Black and isort
- Comprehensive error handling
- Type hints throughout

---

## Installation

```bash
pip install bleu-js[api]
```

Or upgrade from a previous version:

```bash
pip install --upgrade bleu-js[api]
```

## Quick Start

```bash
# Set your API key
bleu config set api-key <your-api-key>

# Chat with AI
bleu chat "What is quantum computing?"

# Generate text
bleu generate "Write a story about AI"

# Create embeddings
bleu embed "Hello world" "Goodbye world"

# List models
bleu models list
```

## Full Documentation

See the [README](https://github.com/HelloblueAI/Bleu.js#-bleu-cli---command-line-interface) for complete CLI documentation and examples.

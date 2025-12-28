# Changelog

## [v1.3.3] - 2025-12-28

### 🎉 Automatic Release
- Version bumped automatically from 1.3.2 to 1.3.3
- See commit history for changes


## [v1.3.2] - 2025-12-28

### 🎉 Automatic Release
- Version bumped automatically from 1.3.1 to 1.3.2
- See commit history for changes


## [v1.3.1] - 2025-12-28

### 🎉 Automatic Release
- Version bumped automatically from 1.3.0 to 1.3.1
- See commit history for changes


## [v1.3.0] - 2025-12-28

### 🎉 Automatic Release
- Version bumped automatically from 1.2.4 to 1.3.0
- See commit history for changes


All notable changes to Bleu.js will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.2.4] - 2025-01-XX

### 🎉 Major Feature: Comprehensive Bleu CLI

#### ✨ New CLI Commands
- **`bleu chat`** - Chat with Bleu.js AI models from command line
  - Support for system messages and custom temperature
  - File input and stdin support
  - JSON output option
- **`bleu generate`** - Text generation with customizable parameters
  - Temperature and max-tokens control
  - File input support
- **`bleu embed`** - Create embeddings for multiple texts
  - Batch processing support
  - File input support
- **`bleu models`** - Model management
  - List all available models
  - Get detailed model information
- **`bleu config`** - Configuration management
  - Set/get API keys
  - View configuration
  - Reset configuration
- **`bleu health`** - API health check
- **`bleu version`** - Version information

#### 🔧 CLI Features
- Built with Click framework for excellent UX
- Multiple input methods: arguments, files, stdin
- Structured JSON output for automation
- Clear error messages with helpful suggestions
- API key configuration via config file or environment variable
- Graceful handling of missing dependencies

#### 📦 Installation & Usage
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

#### 📚 Documentation
- Comprehensive CLI documentation added to README
- Usage examples and advanced patterns
- Integration with existing SDK documentation

#### 🔄 Entry Points
- Added `bleu` command (primary)
- Maintained `bleujs` command (backward compatible)
- Both commands point to the same CLI implementation

### 📦 Dependencies
- Added `click>=8.2.1` to core dependencies

### 🧹 Code Quality
- Formatted with Black and isort
- Comprehensive error handling
- Type hints throughout

## [1.2.3] - 2025-12-13

### 🐛 Critical Bug Fixes
- **Fixed:** Import path errors - Corrected module paths from `src.python.config` to `src.python.backend.config`
- **Fixed:** Method name mismatches - Changed `db_manager.initialize()` to `db_manager.create_tables()`
- **Fixed:** Cache initialization - Deferred async task creation to prevent `RuntimeError: no running event loop`
- **Fixed:** Redis connection handling - Made Redis failures non-fatal, cache gracefully degrades when Redis unavailable
- **Fixed:** SQLAlchemy reserved attribute - Renamed `metadata` column to `dataset_metadata` in Dataset model
- **Fixed:** Missing log_level attribute - Added `log_level` to `APIConfig` with default value
- **Fixed:** Uvicorn startup/shutdown - Replaced deprecated `on_event` with modern `lifespan` handlers
- **Fixed:** Port configuration - Added support for `API_PORT` and `API_HOST` environment variables

### 🔧 Backend Improvements
- Replaced `aioredis` with `redis.asyncio` for Python 3.12 compatibility
- Improved error handling in cache initialization
- Enhanced configuration loading with proper defaults
- Updated FastAPI to use lifespan context manager instead of deprecated events

### 📦 Dependencies
- Installed missing dependencies: `python-dotenv`, `python-jose`, `passlib[bcrypt]`, `python-multipart`
- Replaced `structlog` with standard `logging` (structlog was optional dependency)

### 🧹 Code Quality
- Removed debug instrumentation from production code
- Cleaned up import statements
- Improved error messages and logging

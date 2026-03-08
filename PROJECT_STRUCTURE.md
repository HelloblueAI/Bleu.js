# Bleu.js Project Structure

Clean, organized directory structure for easy navigation and maintenance. Same pattern as Node.js and API-first companies: **this repo = the product** (SDK, CLI, docs); the Node/Express backend lives in a [separate repo](docs/BACKEND_REPO.md).

## 📁 Directory Layout

```
Bleu.js/
├── 📚 docs/               # All documentation
│   ├── guides/            # How-to guides, instructions
│   └── api/               # API documentation
│
├── 🧪 tests/              # All test files
│   └── test_*.py          # Unit and integration tests
│
├── 📦 src/                # Source code
│   ├── bleujs/            # Main package
│   ├── api/               # API routes
│   ├── models/            # Data models
│   ├── services/          # Business logic
│   └── ...
│
├── 🎯 bleu_ai/            # Bleu AI module
│   └── api_client/        # API client (NEW!)
│
├── 📝 examples/           # Example code
│   ├── api_client_*.py    # API client examples
│   └── quick_start.py     # Quick start examples
│
├── 🎬 demos/              # Demo files
│   ├── *.svg              # Demo graphics
│   └── *.gif              # Demo GIFs
│
├── 🔧 scripts/            # Utility scripts
│   └── *.sh               # Shell scripts
│
├── ⚙️ config/             # Configuration files
│
└── 🏗️ build/             # Build artifacts

```

## 📚 Documentation (`docs/`)

All project documentation in one place:

### Main Files:
- `README.md` - Project overview and main documentation
- `CHANGELOG.md` - Version history
- `CONTRIBUTING.md` - Contribution guidelines
- `LICENSE.md` - License information
- `ROADMAP.md` - Future plans

### `/guides/`
Step-by-step instructions:
- Installation guides
- Publishing guides
- Quick start guides
- Migration guides
- How-to documents

### `/api/`
API-specific documentation:
- `API_CLIENT_GUIDE.md` - Complete API reference
- `API_CLIENT_QUICKSTART.md` - Quick start
- API endpoint documentation

## 🧪 Tests (`tests/`)

All test files organized here:
- `test_api_client.py` - API client tests
- `test_*.py` - Feature-specific tests
- `conftest.py` - Test configuration

## 📦 Source Code (`src/`)

Main application code:

```
src/
├── bleujs/           # Core package
├── api/              # API endpoints
├── models/           # Database models
├── services/         # Business logic
├── middleware/       # Request middleware
├── config/           # App configuration
└── ...
```

## 🎯 Bleu AI Module (`bleu_ai/`)

AI-specific functionality:

```
bleu_ai/
├── __init__.py
└── api_client/       # NEW: Cloud API client
    ├── __init__.py
    ├── client.py     # Sync client
    ├── async_client.py
    ├── models.py
    └── exceptions.py
```

## 📝 Examples (`examples/`)

Working code examples:
- `api_client_basic.py` - Basic API usage
- `api_client_async.py` - Async examples
- `api_client_advanced.py` - Advanced patterns
- `quick_start.py` - Quick start examples

## 🎬 Demos (`demos/`)

Demonstration materials:
- `*.svg` - Vector graphics
- `*.gif` - Animated demos

## 🔧 Scripts (`scripts/`)

Utility scripts for development and deployment:
- Build scripts
- Deployment scripts
- Setup scripts
- Utility scripts

## 📋 Root Directory

Keep it clean! Only essential files:

### Configuration Files:
- `pyproject.toml` - Project metadata
- `setup.py` - Package setup
- `.gitignore` - Git ignore rules
- `pytest.ini` - Test configuration
- `mypy.ini` - Type checking config

### Key Files:
- `requirements.txt` - Python dependencies
- `Dockerfile` - Container definition
- `docker-compose.yml` - Docker setup

## 🎯 Benefits of This Structure

### 1. **Easy Navigation**
- Logical grouping of files
- Clear purpose for each directory
- Quick file location

### 2. **Better Git Performance**
- Cleaner diffs
- Easier code reviews
- Less merge conflicts

### 3. **Improved Onboarding**
- New developers find files easily
- Clear project organization
- Self-documenting structure

### 4. **Faster Development**
- Quick access to files
- Less time searching
- Focus on coding

### 5. **Maintainability**
- Easy to update docs
- Clear testing structure
- Organized examples

## 📖 Quick Reference

### Finding Files:

**Documentation:**
```bash
cd docs/                    # All docs
cd docs/api/               # API docs
cd docs/guides/            # How-to guides
```

**Tests:**
```bash
cd tests/                  # All tests
pytest tests/              # Run all tests
```

**Examples:**
```bash
cd examples/               # All examples
python examples/quick_start.py
```

**Scripts:**
```bash
cd scripts/                # Utility scripts
bash scripts/setup.sh
```

## 🔄 Maintenance

### Adding New Documentation:
1. Create `.md` file
2. Place in appropriate `docs/` subdirectory
3. Update `docs/README.md` index

### Adding New Tests:
1. Create `test_*.py` file
2. Place in `tests/` directory
3. Run `pytest` to verify

### Adding New Examples:
1. Create example file
2. Place in `examples/` directory
3. Add comment documentation

## 📊 Statistics

- **Total Markdown Files:** 76+ (all in `docs/`)
- **Test Files:** 58 (all in `tests/`)
- **Source Files:** 670+ Python files
- **Examples:** 9 working examples
- **Scripts:** Multiple utility scripts

## 🎉 Result

**Clean, organized, professional project structure!**

---

**Last Updated:** February 2025
**Version:** 1.3.33
**Organization:** Complete ✅

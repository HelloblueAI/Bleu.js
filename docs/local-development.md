# Local Development Guide

This guide shows you how to run CI/CD checks locally to catch issues before pushing to GitHub.

## Quick Start

### 1. Run All Checks Locally
```bash
./scripts/local-ci.sh
```

### 2. Install Pre-commit Hook (Optional)
```bash
ln -sf scripts/pre-commit-hook.sh .git/hooks/pre-commit
```

### 3. Run GitHub Actions Locally
```bash
# Run entire CI workflow
act -j ci

# Run specific jobs
act -j lint
act -j test
act -j security-scan
```

## Individual Tools

### Code Quality
```bash
# Formatting
black --check src/

# Linting
flake8 src/ --exclude=src/quantum_py/bleujs-env-3.12/

# Type checking
mypy src/ --exclude=src/quantum_py/bleujs-env-3.12/
```

### Security
```bash
# Python security scan
bandit -r src/ --exclude=src/quantum_py/bleujs-env-3.12/

# Dependency vulnerabilities
safety check

# SAST scan (if semgrep installed)
semgrep ci --config auto
```

### Testing
```bash
# Python tests
python -m pytest tests/ -v

# Node.js tests (if applicable)
npm test

# Coverage
python -m pytest tests/ --cov=src/
```

## Common Issues & Solutions

### 1. Virtual Environment Issues
- Exclude `src/quantum_py/bleujs-env-3.12/` from scans
- Use `--exclude` flag with tools

### 2. Missing Dependencies
```bash
# Install Python tools
pip install black flake8 mypy bandit safety pytest

# Install Node.js tools
npm install -g npm-audit
```

### 3. Act Issues
```bash
# Install act
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run with specific Python version
act -j ci --container-architecture linux/amd64
```

## Workflow Integration

### Before Push Checklist
1. ✅ Run `./scripts/local-ci.sh`
2. ✅ Fix any issues found
3. ✅ Commit changes
4. ✅ Push to GitHub

### Pre-commit Hook
The pre-commit hook automatically runs checks before each commit:
```bash
# Install
ln -sf scripts/pre-commit-hook.sh .git/hooks/pre-commit

# Uninstall
rm .git/hooks/pre-commit
```

## Troubleshooting

### Act Not Working
```bash
# Check Docker
docker --version

# Run with verbose output
act -j ci -v

# Use specific event
act push -j ci
```

### Tool Configuration
- **Black**: Uses default settings (88 char line length)
- **Flake8**: Configured in `.flake8` or command line
- **Bandit**: Uses `.bandit` config file
- **MyPy**: Configured in `pyproject.toml`

### Performance Tips
- Run only changed files: `black --check $(git diff --name-only HEAD~1)`
- Skip slow checks: `./scripts/local-ci.sh --skip-tests`
- Use parallel execution where possible

## CI/CD Pipeline Overview

The GitHub Actions workflow includes:
1. **Lint**: Code formatting and style checks
2. **Test**: Unit and integration tests
3. **Security**: Vulnerability scanning
4. **Build**: Package building and validation
5. **Deploy**: Automatic deployment (on main branch)

Local tools mirror these steps to catch issues early.

# Onboarding Guide - Welcome to Bleu.js! 👋

Welcome to the Bleu.js community! This guide will help you get started as a contributor.

## 🎯 Quick Start (10 Minutes)

### 1. Set Up Your Environment

```bash
# Clone the repository
git clone https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js

# Create virtual environment
python -m venv bleujs-env
source bleujs-env/bin/activate  # Linux/Mac
# or
bleujs-env\Scripts\activate     # Windows

# Install in development mode
pip install -e ".[dev]"

# Verify installation
python -c "from bleujs import BleuJS; print('✅ Setup complete!')"
```

### 2. Run Tests

```bash
# Run all tests
pytest

# Should see: "passed" (or some failures if you're fixing bugs)
```

### 3. Explore the Codebase

```bash
# Check project structure
tree -L 2 -I '__pycache__|*.pyc'  # Linux/Mac
# or
dir /s /b  # Windows

# Key directories:
# - src/bleujs/    - Main package code
# - tests/         - Test files
# - docs/          - Documentation
# - examples/      - Code examples
```

### 4. Make Your First Change

```bash
# Create a branch
git checkout -b docs/my-first-contribution

# Make a small change (e.g., fix a typo)
# Edit a file in docs/

# Commit
git add docs/
git commit -m "docs: fix typo in README"

# Push (after setting up your fork)
git push origin docs/my-first-contribution
```

---

## 📚 Learning Resources

### Essential Reading

1. **[Contributor Guide](CONTRIBUTOR_GUIDE.md)** - Start here!
2. **[Contributing Guide](CONTRIBUTING.md)** - Full contribution guide
3. **[Code of Conduct](../CODE_OF_CONDUCT.md)** - Community standards
4. **[API Reference](API_REFERENCE.md)** - Understand the API

### Understanding the Project

- **[Project Structure](../PROJECT_STRUCTURE.md)** - Codebase layout
- **[README](../README.md)** - Project overview
- **[User Guide](USER_CONCERNS_AND_FAQ.md)** - User perspective

### Code Examples

- Check `examples/` directory
- Review test files in `tests/`
- Read docstrings in source code

---

## 🛠️ Development Tools

### Recommended Setup

**IDE:**
- VS Code (with Python extension)
- PyCharm
- Your favorite editor

**Essential Extensions (VS Code):**
- Python
- Pylance
- Black Formatter
- isort

**Git Tools:**
- GitHub CLI (`gh`)
- Git GUI (optional)

### Pre-commit Hooks

```bash
# Install pre-commit hooks (optional but recommended)
pre-commit install

# This will automatically:
# - Format code with Black
# - Sort imports with isort
# - Run linting checks
# - Run basic tests
```

---

## 🎓 Learning Path

### Week 1: Getting Familiar

**Day 1-2: Setup**
- [ ] Set up development environment
- [ ] Run tests successfully
- [ ] Explore codebase structure
- [ ] Read documentation

**Day 3-4: First Contribution**
- [ ] Find a "good first issue"
- [ ] Make a small change (typo, doc improvement)
- [ ] Submit your first PR
- [ ] Get it merged! 🎉

**Day 5-7: Understanding**
- [ ] Read source code
- [ ] Understand test structure
- [ ] Review merged PRs
- [ ] Ask questions in Discussions

### Week 2: Building Skills

**Focus Areas:**
- [ ] Add unit tests
- [ ] Fix small bugs
- [ ] Improve documentation
- [ ] Review other PRs

### Week 3+: Regular Contributions

**You're now a contributor!**
- [ ] Work on features
- [ ] Fix bugs
- [ ] Help newcomers
- [ ] Review PRs

---

## 🤝 Community Engagement

### Join the Community

1. **GitHub Discussions**
   - Introduce yourself
   - Ask questions
   - Share ideas

2. **GitHub Issues**
   - Report bugs
   - Suggest features
   - Help with issues

3. **Pull Requests**
   - Submit contributions
   - Review others' work
   - Provide feedback

### Communication Guidelines

- **Be respectful** - Follow Code of Conduct
- **Be helpful** - Answer questions
- **Be patient** - Everyone learns at different paces
- **Be constructive** - Provide useful feedback

---

## 🎯 Finding Work

### Good First Issues

Look for these labels:
- `good first issue` - Perfect for beginners
- `help wanted` - Community help needed
- `beginner-friendly` - Easy to get started

**Where to Find:**
- [GitHub Issues](https://github.com/HelloblueAI/Bleu.js/issues)
- Filter by labels
- Sort by "newest" or "most commented"

### Types of Contributions

**Documentation:**
- Fix typos
- Improve clarity
- Add examples
- Translate docs

**Code:**
- Fix bugs
- Add features
- Refactor code
- Optimize performance

**Testing:**
- Add tests
- Improve coverage
- Fix failing tests
- Add integration tests

**Community:**
- Answer questions
- Review PRs
- Help newcomers
- Share knowledge

---

## 🐛 Common Issues & Solutions

### Issue: Tests Fail

**Solution:**
```bash
# Check Python version
python --version  # Should be 3.10+

# Reinstall dependencies
pip install -e ".[dev]" --force-reinstall

# Clear cache
pytest --cache-clear
```

### Issue: Import Errors

**Solution:**
```bash
# Make sure you're in the project root
cd /path/to/Bleu.js

# Install in development mode
pip install -e ".[dev]"

# Verify import
python -c "from bleujs import BleuJS"
```

### Issue: Git Conflicts

**Solution:**
```bash
# Update your fork
git fetch upstream
git checkout main
git merge upstream/main

# Rebase your branch
git checkout your-branch
git rebase main
```

### Issue: Pre-commit Hooks Fail

**Solution:**
```bash
# Run formatters manually
black src/
isort src/

# Then commit again
git add .
git commit -m "your message"
```

---

## ✅ Checklist: Are You Ready?

Before making your first contribution:

- [ ] Development environment set up
- [ ] Tests run successfully
- [ ] Read CONTRIBUTING.md
- [ ] Read Code of Conduct
- [ ] Found an issue to work on
- [ ] Understand the codebase structure
- [ ] Know how to create a PR

**All checked?** You're ready to contribute! 🚀

---

## 🎉 Next Steps

1. **Make your first contribution**
   - Pick a "good first issue"
   - Make a small change
   - Submit a PR

2. **Get involved**
   - Join Discussions
   - Help answer questions
   - Review PRs

3. **Keep learning**
   - Read code
   - Study tests
   - Ask questions

4. **Become a regular contributor**
   - Work on features
   - Fix bugs
   - Help newcomers

---

## 🆘 Need Help?

### Resources

- **Documentation:** `docs/` directory
- **Examples:** `examples/` directory
- **Discussions:** GitHub Discussions
- **Issues:** GitHub Issues

### Ask Questions

- Open a question issue
- Post in Discussions
- Email: support@helloblue.ai

**We're here to help!** Don't hesitate to ask. 💬

---

## 🏆 Recognition

### How We Recognize Contributors

- **GitHub Contributors** - Automatic
- **Release Notes** - Credit for features/fixes
- **README** - Contributors section
- **Hall of Fame** - Regular contributors

### Contributor Levels

- **🌱 First Contribution** - Welcome!
- **🌿 Regular Contributor** - Multiple contributions
- **🌳 Core Contributor** - Significant impact
- **⭐ Maintainer** - Project leadership

---

**Welcome to Bleu.js!** We're excited to have you! 🎉

**Ready to start?** Check out [CONTRIBUTOR_GUIDE.md](CONTRIBUTOR_GUIDE.md) for your first contribution!

---

**Last Updated:** 2025-01-XX
**Version:** 1.3.33

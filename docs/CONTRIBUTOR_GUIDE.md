# Contributor Guide - Getting Started 🎯

Welcome! This guide will help you make your first contribution to Bleu.js.

## 🚀 Quick Start (5 Minutes)

### 1. Find Something to Work On

**Good first issues still open:**

| Issue | Topic |
|-------|--------|
| [#234](https://github.com/HelloblueAI/Bleu.js/issues/234) | Unit tests for `BleuAPIClient` timeout handling |
| [#236](https://github.com/HelloblueAI/Bleu.js/issues/236) | Document `[server]` env vars in `INSTALLATION.md` |
| [#237](https://github.com/HelloblueAI/Bleu.js/issues/237) | Markdown link check in CI (`help wanted`) |
| [#238](https://github.com/HelloblueAI/Bleu.js/issues/238) | OpenAPI chat response examples (`help wanted`) |

Issue **#235** is closed. Confirm an issue is still open before you start.

Also browse [all good first issues](https://github.com/HelloblueAI/Bleu.js/issues?q=is%3Aopen+label%3A%22good+first+issue%22) or [help wanted](https://github.com/HelloblueAI/Bleu.js/issues?q=is%3Aopen+label%3A%22help+wanted%22).

### 2. Fork and Clone

```bash
# Fork on GitHub (click Fork button)
# Then clone your fork (replace YOUR_USERNAME with your GitHub username)
git clone https://github.com/YOUR_USERNAME/Bleu.js.git
cd Bleu.js
```

### 3. Set Up Environment

```bash
# Python 3.11, 3.12, or 3.13
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

pip install -e .                # SDK + CLI (pyproject.toml default)
echo 'BLEUJS_API_KEY=bleujs_sk_...' > .env
set -a && source .env && set +a
bleu chat "Hello"
```

Full guide: [Contributing → Development setup](CONTRIBUTING.md#-development-setup). For tests: `pip install -e ".[ci]"` and `pip install -r requirements-dev.txt`.

**Canonical package:** `bleu-js` at the repo root — see [Package map](PACKAGE_MAP.md).

### 4. Make a Small Change

**Example: Fix a Typo**

```bash
git checkout -b docs/fix-typo
# Fix a typo in docs/ or README.md
git add docs/
git commit -m "docs: fix typo in README"
```

Use `docs/` for documentation and `feature/` for code. Do not commit the change on `main`.

### 5. Submit Your First PR

```bash
git push -u origin docs/fix-typo
```

Open the pull request from that branch on GitHub.

In the PR description, include **`Closes #234`** (replace with your issue number) so GitHub closes the issue automatically when the PR merges.

---

## 🎓 Learning Path

### Level 1: Documentation (Beginner)

**Perfect for first-time contributors!**

- Fix typos
- Improve clarity
- Add examples
- Update README
- Translate docs

**Time:** 15-30 minutes
**Skills:** Basic markdown, attention to detail

### Level 2: Testing (Beginner-Intermediate)

**Learn the codebase while contributing!**

- Add unit tests
- Improve test coverage
- Add integration tests
- Fix failing tests

**Time:** 1-2 hours
**Skills:** Python, pytest basics

### Level 3: Bug Fixes (Intermediate)

**Fix real issues!**

- Reproduce bugs
- Find root cause
- Write fix
- Add tests

**Time:** 2-4 hours
**Skills:** Python, debugging, testing

### Level 4: Features (Advanced)

**Build new functionality!**

- Design feature
- Implement
- Add tests
- Update docs

**Time:** 4+ hours
**Skills:** Python, architecture, testing

---

## 🎯 Contribution Ideas by Skill Level

### 🌱 Beginner (No Coding Required)

- [ ] Fix typos in documentation
- [ ] Improve README clarity
- [ ] Add examples to documentation
- [ ] Report bugs with detailed steps
- [ ] Answer questions in Discussions
- [ ] Improve error messages
- [ ] Add comments to code

### 🌿 Intermediate (Some Coding)

- [ ] Add unit tests
- [ ] Fix small bugs
- [ ] Improve code documentation
- [ ] Add code examples
- [ ] Refactor small functions
- [ ] Improve error handling
- [ ] Add type hints

### 🌳 Advanced (More Complex)

- [ ] Implement new features
- [ ] Optimize performance
- [ ] Refactor large modules
- [ ] Add integration tests
- [ ] Improve architecture
- [ ] Add new quantum algorithms
- [ ] Security improvements

---

## 📚 Understanding the Codebase

### Project Structure

```
Bleu.js/
├── src/bleujs/
│   ├── cli.py                 # bleu / bleujs commands
│   ├── api_client/            # BleuAPIClient package (not api_client.py)
│   │   ├── client.py
│   │   ├── async_client.py
│   │   └── exceptions.py
│   ├── quantum.py             # optional [quantum] feature extractor
│   ├── teleportation.py       # optional bleu quantum teleport
│   ├── ml.py                  # optional [ml] HybridTrainer
│   └── core.py                # local BleuJS helper, not the hosted API
├── src/main.py                # optional self-hosted app ([server])
├── docs/api/openapi.yaml      # public API contract
├── services/edge-stub/        # local stand-in for the contract
├── tests/                     # tests, including test_api_client.py and test_cli.py
├── docs/
├── examples/
├── scripts/
└── pyproject.toml
```

### Key Files to Know

- `src/bleujs/cli.py` — CLI entry (`bleu`, `bleujs`)
- `src/bleujs/api_client/` — SDK that calls `https://api.bleujs.org`
- `docs/api/openapi.yaml` — public contract
- `tests/test_api_client.py` and `tests/test_cli.py` — client and CLI tests
- `docs/CONTRIBUTING.md` — full contribution guide
- `pyproject.toml` — package name `bleu-js`, Python `>=3.11,<3.14`, extras

### Code Flow

1. A CLI command enters `src/bleujs/cli.py`.
2. Chat, generate, embed, models, and health build `BleuAPIClient` from `src/bleujs/api_client/`.
3. The client calls `https://api.bleujs.org` unless `BLEUJS_BASE_URL` is set.
4. `bleu quantum teleport` is separate. It imports `src/bleujs/teleportation.py` only when `bleu-js[quantum]` is installed.

---

## 🛠️ Development Workflow

### Daily Workflow

```bash
# 1. Update your fork
git checkout main
git fetch upstream
git merge upstream/main

# 2. Create branch
git checkout -b feature/your-feature

# 3. Make changes
# ... edit files ...

# 4. Test
pytest

# 5. Commit
git add .
git commit -m "feat: your feature description"

# 6. Push
git push origin feature/your-feature

# 7. Create PR on GitHub
```

### Testing Workflow

```bash
# Run all tests
pytest

# Run specific test
pytest tests/test_api_client.py

# Run with coverage
pytest --cov=src --cov-report=html

# Run linting
black --check src/
isort --check src/
flake8 src/
```

---

## 💡 Tips for Success

### Before You Start

1. **Read the issue carefully** - Understand what's needed
2. **Check existing PRs** - Avoid duplicate work
3. **Ask questions** - Use Discussions if unclear
4. **Start small** - Begin with small changes

### While Working

1. **Keep it focused** - One feature/fix per PR
2. **Write tests** - Always add tests for new code
3. **Update docs** - Document your changes
4. **Follow style** - Use Black, isort, type hints

### Before Submitting

1. **Test thoroughly** - Run all tests
2. **Check style** - Run linting tools
3. **Update docs** - Keep documentation current
4. **Write clear PR** - Good description helps review
5. **Link the issue** - Use `Closes #NNN` in the PR body when your work addresses an open issue

---

## 🆘 Getting Help

### Stuck on Something?

1. **Check documentation** - `docs/` directory
2. **Search issues** - Your question might be answered
3. **Ask in Discussions** - Community is helpful
4. **Open a question issue** - We'll help!

### Common Questions

**Q: How do I know if an issue is available?**
A: Check if it's assigned. If not, comment that you're working on it.

**Q: My PR has conflicts. What do I do?**
A: Update your branch: `git fetch upstream && git merge upstream/main`

**Q: How long until my PR is reviewed?**
A: Typically 1-3 business days. We prioritize bug fixes.

**Q: Can I work on multiple issues?**
A: Yes, but focus on one PR at a time for easier review.

---

## 🎉 Your First Contribution

### Step-by-Step: Fix a Typo

1. **Find a typo** in `docs/` or `README.md`
2. **Fork the repo** (if not done)
3. **Create branch:**
   ```bash
   git checkout -b docs/fix-typo
   ```
4. **Fix the typo** in your editor
5. **Commit:**
   ```bash
   git add docs/README.md
   git commit -m "docs: fix typo in README"
   ```
6. **Push:**
   ```bash
   git push origin docs/fix-typo
   ```
7. **Create PR** on GitHub
8. **Celebrate!** 🎉

### Step-by-Step: Add a Test

1. **Find a function** without tests in `src/bleujs/`
2. **Add a test** next to the existing files, for example `tests/test_api_client.py` or `tests/test_cli.py`
3. **Run it:** `pytest tests/test_api_client.py`
5. **Commit and PR** (same as above)

---

## 🏆 Recognition

### How Contributors Are Recognized

- **GitHub Contributors** - Automatic recognition
- **Release Notes** - Credit for features/fixes
- **README** - Contributors section
- **Documentation** - Credit for docs

### Contributor Levels

- **🌱 First Contribution** - Welcome! You're in!
- **🌿 Regular Contributor** - Multiple contributions
- **🌳 Core Contributor** - Significant contributions
- **⭐ Maintainer** - Invited to maintain project

---

## 📖 Next Steps

1. **Read [CONTRIBUTING.md](CONTRIBUTING.md)** - Full guide
2. **Check [Good First Issues](https://github.com/HelloblueAI/Bleu.js/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)**
3. **Join Discussions** - Introduce yourself!
4. **Make your first contribution** - Start small!

---

## 🎯 Resources

- **[Full Contributing Guide](CONTRIBUTING.md)** - Complete guide
- **[Code of Conduct](../CODE_OF_CONDUCT.md)** - Community standards
- **[API Reference](API_REFERENCE.md)** - Understand the API
- **[Product architecture](PRODUCT_ARCHITECTURE.md)** - Codebase layout and which app is the product

---

**Ready to contribute?** Pick an issue and get started.

**Questions?** Open a discussion or issue. We're here to help.

# 📦 Publishing Bleu.js v1.2.1 to PyPI

## ✅ Pre-Publication Checklist

Before publishing, ensure everything is ready:

- [x] ✅ All modules implemented (core, quantum, ml, monitoring, security)
- [x] ✅ Examples working (quick_start, quantum_example, ml_example)
- [x] ✅ Tests passing
- [x] ✅ Documentation complete (README, QUICKSTART, MIGRATION_GUIDE)
- [x] ✅ Version bumped to 1.2.1
- [x] ✅ setup.py configured correctly
- [x] ✅ Dependencies optimized (minimal core)
- [x] ✅ All imports work

---

## 🚀 Publication Steps

### Step 1: Install Build Tools

```bash
# Ensure pyenv & virtualenv are configured first
python3 -m pip install --upgrade build twine setuptools wheel
```

### Step 2: Clean Previous Builds

```bash
cd /home/pejmanhaghighatnia/Documents/Bleu.js
rm -rf dist build bleu_js.egg-info src/bleu_js.egg-info
```

### Step 3: Build the Package

```bash
# Using pyenv Python (3.12.2) – build can fail in sandboxed shells, so fallback is setup.py
~/.pyenv/versions/3.12.2/bin/python setup.py sdist bdist_wheel
```

**Expected Output:**
```
Successfully built bleu-js-1.2.0.tar.gz and bleu_js-1.2.0-py3-none-any.whl
```

### Step 4: Verify the Build

```bash
ls -lh dist/
# Should see:
# - bleu-js-1.2.0.tar.gz
# - bleu_js-1.2.0-py3-none-any.whl
```

### Step 5: Test the Package Locally

```bash
# Create test environment
python3 -m venv test_env
source test_env/bin/activate

# Install from local build
pip install dist/bleu_js-1.2.0-py3-none-any.whl

# Test it works
python3 -c "from bleujs import BleuJS, __version__; print(f'Version: {__version__}')"

# Test example
python3 examples/quick_start.py

# Clean up
deactivate
rm -rf test_env
```

### Step 6: Upload to TestPyPI (Optional but Recommended)

```bash
# Upload to test server first
python3 -m twine upload --repository testpypi dist/*

# Test installation from TestPyPI
pip install --index-url https://test.pypi.org/simple/ bleu-js==1.2.0

# If successful, proceed to real PyPI
```

### Step 7: Upload to PyPI

```bash
# Upload to real PyPI
python3 -m twine upload dist/*
```

**You'll be prompted for:**
- Username: `__token__`
- Password: Your PyPI API token (starts with `pypi-...`)

### Step 8: Verify on PyPI

Visit: https://pypi.org/project/bleu-js/

Check that:
- ✅ Version shows 1.2.0
- ✅ README displays correctly
- ✅ Dependencies are correct
- ✅ Download links work

### Step 9: Test Installation from PyPI

```bash
# Create fresh environment
python3 -m venv verify_env
source verify_env/bin/activate

# Install from PyPI
pip install bleu-js

# Verify it works
python3 -c "from bleujs import BleuJS, __version__; print(f'✅ Installed v{__version__}')"

# Test basic functionality
python3 << 'EOF'
from bleujs import BleuJS
bleu = BleuJS()
result = bleu.process({'data': [1, 2, 3]})
print(f"✅ Status: {result['status']}")
EOF

# Clean up
deactivate
rm -rf verify_env
```

---

## 🔐 PyPI Authentication

### Option 1: API Token (Recommended)

1. Go to: https://pypi.org/manage/account/token/
2. Create new API token
3. Name it: "bleu-js-deployment"
4. Scope: "Project: bleu-js"
5. Copy the token (starts with `pypi-...`)

Use with twine:
```bash
python3 -m twine upload dist/*
# Username: __token__
# Password: pypi-your-token-here
```

### Option 2: .pypirc File

Create `~/.pypirc`:
```ini
[pypi]
username = __token__
password = pypi-your-token-here

[testpypi]
username = __token__
password = pypi-your-testpypi-token-here
```

Then:
```bash
chmod 600 ~/.pypirc
python3 -m twine upload dist/*
```

---

## 📝 Post-Publication Tasks

### 1. Create GitHub Release

```bash
git tag -a v1.2.1 -m "Release v1.2.1 - Python 3.12 compatibility"
git push origin v1.2.1
```

Then create release on GitHub with:
- Title: "v1.2.1 – Python 3.12 Compatibility"
- Description: Copy from MIGRATION_GUIDE.md
- Attach: dist/*.tar.gz and dist/*.whl

### 2. Update Documentation

- [ ] Update README badges
- [ ] Update version numbers
- [ ] Link to PyPI page
- [ ] Update installation instructions

### 3. Announce the Release

**Twitter/X:**
```
🎉 Bleu.js v1.2.1 is LIVE on PyPI!

✅ All promised features now implemented
✅ 40x smaller core package
✅ Optional quantum/ML features
✅ Zero import errors
✅ Working examples included

pip install bleu-js

#AI #MachineLearning #QuantumComputing #Python
```

**LinkedIn:**
```
Excited to announce Bleu.js v1.2.1! 🚀

This major update delivers everything promised:
• Complete quantum computing integration
• Full ML training pipeline
• Performance monitoring
• Quantum-resistant security
• 40x smaller core package

Try it: pip install bleu-js

#AI #ML #QuantumComputing #OpenSource
```

**Reddit (r/Python, r/MachineLearning):**
```
Title: Bleu.js v1.2.1 – Python 3.12 Compatible & API Client Included

Body: See MIGRATION_GUIDE.md content
```

### 4. Monitor Installation

Check stats at:
- PyPI: https://pypistats.org/packages/bleu-js
- GitHub: https://github.com/HelloblueAI/Bleu.js/graphs/traffic

### 5. Respond to Issues

Monitor:
- GitHub Issues: https://github.com/HelloblueAI/Bleu.js/issues
- PyPI comments
- Social media mentions

---

## 🐛 Troubleshooting

### Issue: "Could not find a version that satisfies the requirement"

**Solution:**
```bash
# Check if package uploaded successfully
pip search bleu-js

# Force refresh pip cache
pip cache purge
pip install --no-cache-dir bleu-js
```

### Issue: "Filename has already been used"

**Solution:**
```bash
# Increment version number in setup.py and pyproject.toml
# Rebuild and re-upload
```

### Issue: "Invalid distribution file"

**Solution:**
```bash
# Clean and rebuild
rm -rf dist/ build/ *.egg-info
python3 -m build
```

### Issue: "HTTPError: 403 Forbidden"

**Solution:**
- Check your PyPI API token is valid
- Ensure you have permission to upload to bleu-js
- Use `__token__` as username, not your PyPI username

---

## 📊 Success Metrics

After publishing, track:

### Day 1 (First 24 hours)
- [ ] 10+ downloads
- [ ] No critical issues reported
- [ ] Examples work for users
- [ ] Positive feedback

### Week 1 (First 7 days)
- [ ] 100+ downloads
- [ ] GitHub stars increase
- [ ] Community engagement
- [ ] Feature requests

### Month 1 (First 30 days)
- [ ] 1,000+ downloads
- [ ] Active user base
- [ ] Documentation requests
- [ ] Contribution interest

---

## ✅ Quick Command Reference

```bash
# Complete publication workflow:

# 1. Clean
sudo rm -rf dist/ build/ *.egg-info src/*.egg-info

# 2. Build
python3 -m build

# 3. Test locally
pip install dist/*.whl

# 4. Upload to TestPyPI (optional)
python3 -m twine upload --repository testpypi dist/*

# 5. Upload to PyPI
python3 -m twine upload dist/*

# 6. Verify
pip install --upgrade bleu-js
python3 -c "from bleujs import __version__; print(__version__)"

# 7. Tag release
git tag -a v1.2.1 -m "Release v1.2.1"
git push origin v1.2.1
```

---

## 🎉 You're Ready!

Your package is:
- ✅ Feature-complete
- ✅ Well-tested
- ✅ Properly documented
- ✅ User-friendly
- ✅ Production-ready

**Time to share it with the world!** 🚀

---

**Questions?** Contact support@helloblue.ai

**Made with ❤️ by the Bleu.js Team**


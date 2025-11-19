# 🚀 Bleu.js Installation Guide

Simple installation instructions for users.

---

## ⚡ Quick Install (Recommended)

### Simple Installation:

```bash
pip install bleu-js
```

This is what we promote on bleujs.org!

**Includes:**
- ✅ Core bleujs package
- ✅ Basic functionality
- ✅ All essential features

### For API Client Features (Optional):

```bash
pip install bleu-js[api]
```

**Additional includes:**
- ✅ API client for bleujs.org
- ✅ HTTP client (httpx)
- ✅ Data validation (pydantic)

---

## 📦 Installation Options

### Option 1: Minimal Install (Core Only)

```bash
pip install bleu-js
```

**Includes:**
- Core BleuJS functionality
- Basic utilities
- No API client, quantum, or ML features

**Use when:** You only need basic features

---

### Option 2: API Client (Recommended for Most Users)

```bash
pip install bleu-js[api]
```

**Includes:**
- Everything from core
- API client for cloud API
- Sync & async support

**Use when:** You want to use the cloud API at bleujs.org

---

### Option 3: Machine Learning Features

```bash
pip install bleu-js[ml]
```

**Includes:**
- Core features
- scikit-learn
- XGBoost
- pandas

**Use when:** You need ML capabilities

---

### Option 4: Quantum Computing Features

```bash
pip install bleu-js[quantum]
```

**Includes:**
- Core features
- Qiskit
- PennyLane

**Use when:** You need quantum computing features

---

### Option 5: Deep Learning Features

```bash
pip install bleu-js[deep]
```

**Includes:**
- Core features
- PyTorch
- TensorFlow

**Use when:** You need deep learning capabilities

---

### Option 6: Everything (All Features)

```bash
pip install bleu-js[all]
```

**Includes:**
- ✅ Core features
- ✅ API client
- ✅ Machine learning
- ✅ Quantum computing
- ✅ Deep learning
- ✅ All optional dependencies

**Use when:** You want all features available

---

## 🖥️ Step-by-Step Installation

### For macOS/Linux:

```bash
# Step 1: Open Terminal

# Step 2: Ensure pip is installed
python3 --version
pip3 --version

# Step 3: Install bleu-js
pip3 install bleu-js[api]

# Step 4: Verify installation
python3 -c "from bleujs.api_client import BleuAPIClient; print('✅ Installed successfully!')"
```

### For Windows:

```bash
# Step 1: Open Command Prompt or PowerShell

# Step 2: Ensure pip is installed
python --version
pip --version

# Step 3: Install bleu-js
pip install bleu-js[api]

# Step 4: Verify installation
python -c "from bleujs.api_client import BleuAPIClient; print('✅ Installed successfully!')"
```

---

## 🔄 Upgrade Existing Installation

If you already have bleu-js installed:

```bash
# Upgrade to latest version
pip install --upgrade bleu-js[api]
```

---

## 🐍 Using Virtual Environments (Recommended)

### Create Virtual Environment:

```bash
# macOS/Linux
python3 -m venv bleujs-env
source bleujs-env/bin/activate
pip install bleu-js[api]

# Windows
python -m venv bleujs-env
bleujs-env\Scripts\activate
pip install bleu-js[api]
```

### Deactivate when done:

```bash
deactivate
```

---

## ✅ Verify Installation

### Quick Test:

```bash
python3 -c "import bleujs; print(f'Bleu.js version: {bleujs.__version__}')"
```

### Test API Client:

```bash
python3 << EOF
from bleujs.api_client import BleuAPIClient
print('✅ API Client installed successfully!')
EOF
```

---

## 📝 First Steps After Installation

### 1. Get Your API Key:

Visit https://bleujs.org and create an account to get your API key.

### 2. Set Your API Key:

```bash
# macOS/Linux
export BLEUJS_API_KEY="bleujs_sk_your_key_here"

# Windows (PowerShell)
$env:BLEUJS_API_KEY = "bleujs_sk_your_key_here"

# Windows (Command Prompt)
set BLEUJS_API_KEY=bleujs_sk_your_key_here
```

### 3. Try Your First Request:

Create a file `test.py`:

```python
from bleujs.api_client import BleuAPIClient

# Create client
client = BleuAPIClient()

# Make your first request
response = client.chat([
    {"role": "user", "content": "Hello! What can you do?"}
])

print(response.content)
```

Run it:

```bash
python3 test.py
```

---

## 🔧 Troubleshooting

### Problem: "pip: command not found"

**Solution:**
```bash
# macOS/Linux
python3 -m ensurepip --upgrade

# Windows
python -m ensurepip --upgrade
```

### Problem: "Permission denied"

**Solution:**
```bash
# Don't use sudo! Use user install instead:
pip install --user bleu-js[api]
```

### Problem: "ModuleNotFoundError: No module named 'bleujs'"

**Solution:**
```bash
# Check Python version (must be 3.8+)
python3 --version

# Reinstall
pip3 install --upgrade bleu-js[api]

# Verify
python3 -c "import bleujs; print('Success!')"
```

### Problem: "ImportError: cannot import name 'BleuAPIClient'"

**Solution:**
```bash
# Make sure you installed with [api] extra
pip install --upgrade bleu-js[api]

# Not just: pip install bleu-js
```

### Problem: "httpx is required"

**Solution:**
```bash
# Install with API extras
pip install bleu-js[api]

# Or install httpx manually
pip install httpx pydantic
```

---

## 📋 System Requirements

### Minimum Requirements:
- **Python:** 3.8 or higher
- **pip:** Latest version recommended
- **Internet:** For PyPI downloads and API access
- **Disk Space:** ~50 MB (minimal install)

### Recommended:
- **Python:** 3.10 or higher
- **pip:** 23.0+
- **Virtual Environment:** venv or conda
- **Disk Space:** ~500 MB (full install with all extras)

---

## 🌐 Alternative Installation Methods

### From GitHub (Development Version):

```bash
pip install git+https://github.com/HelloblueAI/Bleu.js.git
```

### From Source:

```bash
# Clone repository
git clone https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js

# Install in development mode
pip install -e ".[api]"
```

---

## 📦 Uninstall

If you need to remove bleu-js:

```bash
pip uninstall bleu-js
```

---

## 💡 Quick Examples

### After Installation:

```bash
# Example 1: Basic chat
python3 << EOF
from bleujs.api_client import BleuAPIClient
client = BleuAPIClient(api_key="bleujs_sk_...")
response = client.chat([{"role": "user", "content": "Hello!"}])
print(response.content)
EOF
```

```bash
# Example 2: Text generation
python3 << EOF
from bleujs.api_client import BleuAPIClient
client = BleuAPIClient(api_key="bleujs_sk_...")
response = client.generate("Write a haiku about AI:")
print(response.text)
EOF
```

---

## 📚 Next Steps

After installation:

1. ✅ **Read Quick Start:** [`docs/api/API_CLIENT_QUICKSTART.md`](api/API_CLIENT_QUICKSTART.md)
2. ✅ **Try Examples:** `examples/api_client_basic.py`
3. ✅ **Read Full Guide:** [`docs/api/API_CLIENT_GUIDE.md`](api/API_CLIENT_GUIDE.md)
4. ✅ **Join Community:** https://discord.gg/bleujs

---

## 🆘 Need Help?

- **Documentation:** https://bleujs.org/docs
- **GitHub Issues:** https://github.com/HelloblueAI/Bleu.js/issues
- **Email:** support@helloblue.ai
- **Discord:** https://discord.gg/bleujs

---

## ✨ You're Ready!

```bash
pip install bleu-js[api]
```

That's it! You're ready to use Bleu.js! 🚀

---

**Last Updated:** November 2025  
**Version:** 1.2.1  
**Status:** Production-Ready ✅


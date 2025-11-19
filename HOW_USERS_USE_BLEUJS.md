# 🎯 How Users Can Use Bleu.js

**Quick Reference Guide**

---

## ✅ Method 1: Terminal Installation (WORKS NOW)

```bash
pip install bleu-js
```

**What users get:**
- Core Bleu.js package ✅
- CLI commands ✅
- Local ML/Quantum processing ✅
- Python imports ✅

**Usage:**
```bash
# CLI commands
bleujs --version
bleujs process --input data.json

# Python imports
python
>>> from bleujs import BleuJS
>>> bleu = BleuJS()
>>> result = bleu.process("data")
```

---

## ✅ Method 2: FastAPI Backend at bleujs.org (WORKS NOW)

### A. Web Dashboard
```
https://bleujs.org/dashboard
```

**Features:**
- Sign up / Login ✅
- Get API keys ✅
- View usage statistics ✅
- Manage subscriptions ✅
- Test API playground ✅

### B. Direct API Calls
```bash
# Chat completion
curl -X POST https://bleujs.org/api/v1/chat \
  -H "Authorization: Bearer bleujs_sk_..." \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'

# Text generation
curl -X POST https://bleujs.org/api/v1/generate \
  -H "Authorization: Bearer bleujs_sk_..." \
  -d '{"prompt": "Write a story..."}'

# Embeddings
curl -X POST https://bleujs.org/api/v1/embed \
  -H "Authorization: Bearer bleujs_sk_..." \
  -d '{"inputs": ["text1", "text2"]}'

# List models
curl -X GET https://bleujs.org/api/v1/models \
  -H "Authorization: Bearer bleujs_sk_..."
```

**Subscription Plans:**
- Basic: $29/month (100 calls)
- Enterprise: $499/month (5000 calls)

---

## ✅ Method 3: Python SDK - Current Implementation (WORKS NOW)

### Option A: API Client for Cloud

```bash
# Install with API support
pip install bleu-js[api]
```

```python
from bleujs.api_client import BleuAPIClient

# Initialize
client = BleuAPIClient(api_key="bleujs_sk_...")

# Chat
response = client.chat([
    {"role": "user", "content": "Hello!"}
])
print(response.content)

# Generate
response = client.generate("Write a story...")
print(response.text)

# Embed
response = client.embed(["text1", "text2"])
print(response.embeddings)

# List models
models = client.list_models()
```

**Status:** ✅ WORKING - Backend endpoints implemented!

### Option B: Local ML/Quantum Processing

```bash
# Install core package
pip install bleu-js
```

```python
from bleujs import BleuJS

# Local processing
bleu = BleuJS(quantum_mode=True, device="cuda")
result = bleu.process("data")

# Use quantum features
from bleujs.quantum import QuantumProcessor
processor = QuantumProcessor()
enhanced = processor.process(data)

# Use ML features
from bleujs.ml import HybridTrainer
trainer = HybridTrainer()
model = trainer.train(features, labels)
```

**Status:** ✅ WORKING

---

## 🔮 Method 4: Python SDK - Proposed Simplified (FUTURE)

### Proposed Installation:
```bash
# Option 1: Cloud API client
pip install bleujs-client

# Option 2: Local ML/CLI
pip install bleu-js
```

### Proposed Usage:
```python
from bleujs_client import BleuJS

# Initialize
client = BleuJS(api_key="bleujs_sk_...")

# Simplified chat interface
response = client.chat.create(
    messages=[{"role": "user", "content": "Hello!"}]
)

print(f"Response: {response.content}")
print(f"Confidence: {response.confidence * 100:.2f}%")
# Output: Confidence: 99.99%

# Other methods
response = client.generate.create(prompt="...")
embeddings = client.embed.create(inputs=[...])
models = client.models.list()
```

**Status:** ⏳ PROPOSED (Not yet implemented)

---

## 📊 Quick Comparison

| Method | Installation | Status | Use Case |
|--------|-------------|--------|----------|
| **Terminal** | `pip install bleu-js` | ✅ Working | CLI, scripts, automation |
| **Web Dashboard** | N/A (web) | ✅ Working | Visual interface, management |
| **API Client (Current)** | `pip install bleu-js[api]` | ✅ Working | Production apps, cloud |
| **Local ML** | `pip install bleu-js` | ✅ Working | Research, privacy, offline |
| **Simplified SDK** | `pip install bleujs-client` | ⏳ Future | Easier API (proposed) |

---

## 🎯 What Users Should Do NOW

### For Cloud API Access:
```bash
# 1. Install
pip install bleu-js[api]

# 2. Get API key from bleujs.org dashboard

# 3. Use
from bleujs.api_client import BleuAPIClient
client = BleuAPIClient(api_key="bleujs_sk_...")
response = client.chat([{"role": "user", "content": "Hello!"}])
```

### For Local Processing:
```bash
# 1. Install
pip install bleu-js

# 2. Use
from bleujs import BleuJS
bleu = BleuJS(quantum_mode=True)
result = bleu.process("data")
```

### For Web Interface:
```
1. Visit: https://bleujs.org
2. Sign up
3. Go to dashboard
4. Get API key
5. Use in code or playground
```

---

## ✅ All Methods Are Ready!

1. ✅ **Terminal:** `pip install bleu-js` - WORKS
2. ✅ **FastAPI Backend:** Endpoints implemented - WORKS
3. ✅ **Python SDK:** API client ready - WORKS
4. ✅ **Local Processing:** Full features - WORKS
5. ⏳ **Simplified SDK:** Future improvement

---

**Everything users need is READY and WORKING!** 🎉

**Last Updated:** October 29, 2025  
**Status:** ✅ PRODUCTION-READY



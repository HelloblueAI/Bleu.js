# 🚀 Complete Bleu.js User Guide

**How to Use Bleu.js - All Methods Explained**

---

## 🎯 Three Ways to Use Bleu.js

### 1. **Terminal/CLI** - Command Line Interface
### 2. **FastAPI Backend** - Web Dashboard at bleujs.org
### 3. **Python SDK** - Programmatic Access

---

## 📦 Method 1: Terminal Installation & CLI

### Installation:
```bash
# Install the core package
pip install bleu-js

# Or install with API client support
pip install bleu-js[api]

# Or install everything
pip install bleu-js[all]
```

### Usage:
```bash
# Use CLI commands
bleujs --version

# Process data
bleujs process --input data.json

# Train models
bleujs train --model xgboost --data training.csv

# Health check
bleujs health
```

### What You Get:
- ✅ Command-line tools
- ✅ Local ML/Quantum processing
- ✅ Offline capabilities
- ✅ Direct Python imports

---

## 🌐 Method 2: FastAPI Backend & Web Dashboard

### Access:
```
https://bleujs.org/dashboard
```

### Features:

#### 1. **Web Dashboard**
- 📊 Real-time analytics
- 📈 Usage statistics
- 🔑 API key management
- 💳 Subscription management
- 📱 Model monitoring

#### 2. **API Endpoints**

**Base URL:** `https://bleujs.org`

##### Authentication:
```bash
curl -X POST https://bleujs.org/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secure_pass"}'
```

##### Get API Key:
```bash
curl -X POST https://bleujs.org/api/v1/auth/api-key \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

##### Chat Completion:
```bash
curl -X POST https://bleujs.org/api/v1/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "model": "bleu-quantum-1"
  }'
```

##### Text Generation:
```bash
curl -X POST https://bleujs.org/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a story about...",
    "model": "bleu-quantum-1",
    "max_tokens": 1000
  }'
```

##### Text Embeddings:
```bash
curl -X POST https://bleujs.org/api/v1/embed \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": ["text1", "text2"],
    "model": "bleu-embed-1"
  }'
```

##### List Models:
```bash
curl -X GET https://bleujs.org/api/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Subscription Plans:

#### Basic Plan - $29/month
- 100 API calls per month
- Standard API access
- Email support
- 10 requests/minute

#### Enterprise Plan - $499/month
- 5000 API calls per month
- Priority API access
- 24/7 support
- 100 requests/minute
- Custom solutions

---

## 🐍 Method 3: Python SDK

### Two Options:

### Option A: API Client (Cloud API) ✅ **CURRENT IMPLEMENTATION**

```bash
# Install with API client support
pip install bleu-js[api]
```

```python
from bleujs.api_client import BleuAPIClient

# Initialize client
client = BleuAPIClient(api_key="bleujs_sk_...")

# Chat completion
response = client.chat([
    {"role": "user", "content": "Hello!"}
])
print(response.content)

# Text generation
response = client.generate("Write a story about quantum computing")
print(response.text)

# Create embeddings
response = client.embed(["text1", "text2", "text3"])
embeddings = response.embeddings

# List models
models = client.list_models()
for model in models.models:
    print(f"{model.name}: {model.description}")
```

### Option B: Local Processing (ML/Quantum)

```bash
# Install core package
pip install bleu-js
```

```python
from bleujs import BleuJS

# Initialize for local processing
bleu = BleuJS(
    quantum_mode=True,
    device="cuda"  # or "cpu"
)

# Process data locally
result = bleu.process(
    input_data="your_data",
    quantum_features=True
)

# Train models locally
from bleujs.ml import HybridTrainer

trainer = HybridTrainer()
model = trainer.train(features, labels)

# Use quantum features
from bleujs.quantum import QuantumProcessor

processor = QuantumProcessor()
enhanced_data = processor.process(data)
```

---

## 🎨 Proposed: Simplified SDK (Future)

### Option: Unified Client

```bash
# Future simplified installation
pip install bleujs-client
```

```python
from bleujs_client import BleuJS

# Initialize with API key (cloud)
client = BleuJS(api_key="bleujs_sk_...")

# Simplified chat interface
response = client.chat.create(
    messages=[{"role": "user", "content": "Hello!"}]
)

print(f"Response: {response.content}")
print(f"Confidence: {response.confidence * 100:.2f}%")
# Output: Confidence: 99.99%

# Simplified generation
response = client.generate.create(
    prompt="Write a story...",
    temperature=0.7
)

# Simplified embeddings
embeddings = client.embed.create(
    inputs=["text1", "text2"]
)

# Model management
models = client.models.list()
```

---

## 📊 Complete Comparison

### Current Implementation (v1.2.1)

| Method | Package | Import | Usage |
|--------|---------|--------|-------|
| **CLI** | `pip install bleu-js` | N/A | `bleujs process` |
| **API Client** | `pip install bleu-js[api]` | `from bleujs.api_client import BleuAPIClient` | `client.chat([...])` |
| **Local ML** | `pip install bleu-js` | `from bleujs import BleuJS` | `bleu.process(...)` |
| **Web Dashboard** | N/A (web interface) | N/A | https://bleujs.org/dashboard |

### Proposed Simplified (Future)

| Method | Package | Import | Usage |
|--------|---------|--------|-------|
| **Cloud API** | `pip install bleujs-client` | `from bleujs_client import BleuJS` | `client.chat.create(...)` |
| **Local/CLI** | `pip install bleu-js` | `from bleujs import BleuJS` | Same as current |

---

## 🚀 Quick Start Examples

### Example 1: Web Dashboard User

```
1. Go to https://bleujs.org
2. Sign up / Log in
3. Go to Dashboard
4. Generate API key
5. Use in your code or test in playground
```

### Example 2: Python Developer (API Client)

```bash
# Install
pip install bleu-js[api]
```

```python
# Use
from bleujs.api_client import BleuAPIClient

client = BleuAPIClient(api_key="bleujs_sk_...")
response = client.chat([{"role": "user", "content": "Hello!"}])
print(response.content)
```

### Example 3: ML Researcher (Local Processing)

```bash
# Install
pip install bleu-js[all]
```

```python
# Use local quantum processing
from bleujs import BleuJS
from bleujs.quantum import QuantumProcessor

bleu = BleuJS(quantum_mode=True)
result = bleu.process(data)
```

### Example 4: CLI Power User

```bash
# Install
pip install bleu-js

# Use CLI
bleujs train --model xgboost --data training.csv
bleujs predict --model saved_model.pkl --input test.csv
bleujs health
```

---

## 📖 Full Usage Documentation

### Environment Variables:

```bash
# API client configuration
export BLEUJS_API_KEY="bleujs_sk_your_key_here"
export BLEUJS_BASE_URL="https://bleujs.org"  # Optional

# Local configuration
export BLEUJS_DEVICE="cuda"  # or "cpu"
export BLEUJS_QUANTUM_MODE="true"
export BLEUJS_LOG_LEVEL="INFO"
```

### Configuration File:

```python
# config.py
from bleujs import BleuJS

config = {
    "quantum_mode": True,
    "device": "cuda",
    "model_path": "models/",
    "api_key": "bleujs_sk_...",
    "base_url": "https://bleujs.org"
}

# For local use
bleu = BleuJS(**config)

# For API use
from bleujs.api_client import BleuAPIClient
client = BleuAPIClient(
    api_key=config["api_key"],
    base_url=config["base_url"]
)
```

---

## 🎯 Which Method Should You Use?

### Use **Web Dashboard** if:
- ✅ You want a visual interface
- ✅ You need to manage API keys
- ✅ You want to monitor usage
- ✅ You're a non-technical user
- ✅ You need to manage subscriptions

### Use **API Client (Cloud)** if:
- ✅ You're building a production application
- ✅ You want scalable cloud processing
- ✅ You need high availability
- ✅ You want managed infrastructure
- ✅ You need the latest models

### Use **Local Processing** if:
- ✅ You need offline capabilities
- ✅ You have sensitive data (privacy)
- ✅ You want to train custom models
- ✅ You're doing research
- ✅ You have powerful local hardware

### Use **CLI** if:
- ✅ You're automating workflows
- ✅ You need batch processing
- ✅ You're integrating with scripts
- ✅ You prefer command-line tools

---

## 🔗 All Access Methods Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     Bleu.js Ecosystem                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Terminal/CLI                                             │
│     $ pip install bleu-js                                    │
│     $ bleujs process --input data.json                       │
│                                                               │
│  2. Web Dashboard                                            │
│     https://bleujs.org/dashboard                            │
│     • Sign up • Get API key • Use playground                │
│                                                               │
│  3. Python SDK - API Client                                  │
│     $ pip install bleu-js[api]                              │
│     from bleujs.api_client import BleuAPIClient             │
│     client = BleuAPIClient(api_key="...")                   │
│     response = client.chat([...])                           │
│                                                               │
│  4. Python SDK - Local ML                                    │
│     $ pip install bleu-js                                   │
│     from bleujs import BleuJS                               │
│     bleu = BleuJS(quantum_mode=True)                        │
│     result = bleu.process(data)                             │
│                                                               │
│  5. FastAPI Direct                                           │
│     curl -X POST https://bleujs.org/api/v1/chat \           │
│       -H "Authorization: Bearer KEY" \                       │
│       -d '{"messages": [...]}'                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Current Status (v1.2.1)

### ✅ What Works NOW:

1. **Installation:**
   - ✅ `pip install bleu-js` - Works
   - ✅ `pip install bleu-js[api]` - Works
   - ✅ `pip install bleu-js[all]` - Works

2. **API Client:**
   - ✅ `from bleujs.api_client import BleuAPIClient` - Works
   - ✅ `client.chat([...])` - Backend ready
   - ✅ `client.generate(...)` - Backend ready
   - ✅ `client.embed([...])` - Backend ready
   - ✅ `client.list_models()` - Backend ready

3. **Local Processing:**
   - ✅ `from bleujs import BleuJS` - Works
   - ✅ `bleu.process(...)` - Works
   - ✅ Quantum features - Works
   - ✅ ML features - Works

4. **Backend API:**
   - ✅ POST /api/v1/chat - Implemented
   - ✅ POST /api/v1/generate - Implemented
   - ✅ POST /api/v1/embed - Implemented
   - ✅ GET /api/v1/models - Implemented

### 🔮 Coming Soon:

1. **Simplified SDK:**
   - ⏳ `pip install bleujs-client`
   - ⏳ `client.chat.create(...)` syntax
   - ⏳ Confidence scores in responses
   - ⏳ Simplified API

2. **Web Dashboard:**
   - ⏳ Visual interface at bleujs.org/dashboard
   - ⏳ API key management UI
   - ⏳ Usage analytics
   - ⏳ Playground

---

## 📚 Documentation Links

- **API Reference:** https://bleujs.org/docs/api
- **Quick Start:** `docs/QUICKSTART.md`
- **API Client Guide:** `docs/API_CLIENT_GUIDE.md`
- **Installation Guide:** `docs/INSTALLATION_FOR_USERS.md`
- **Examples:** `examples/`

---

## 💡 Support

- **Email:** support@helloblue.ai
- **GitHub:** https://github.com/HelloblueAI/Bleu.js
- **Website:** https://bleujs.org

---

**Last Updated:** October 29, 2025  
**Version:** 1.2.1  
**Status:** ✅ Ready for Users!

---



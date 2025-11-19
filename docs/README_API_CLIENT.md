# 🚀 Bleu.js API Client - Now Available!

## Access the Cloud API from Python

The Bleu.js package now includes a **production-ready API client** to access the cloud API at **bleujs.org**!

---

## ⚡ Quick Start

### Install

```bash
pip install bleu-js[api]
```

### Use

```python
from bleu_ai.api_client import BleuAPIClient

client = BleuAPIClient(api_key="bleujs_sk_...")

# Chat
response = client.chat([
    {"role": "user", "content": "What is quantum computing?"}
])
print(response.content)

# Generate
response = client.generate("Write a haiku about AI:")
print(response.text)

# Embeddings
response = client.embed(["text1", "text2"])
print(response.embeddings)
```

---

## 🌟 Features

✅ **Chat Completion** - Conversational AI  
✅ **Text Generation** - Creative content  
✅ **Embeddings** - Semantic vectors  
✅ **Model Listing** - Available models  
✅ **Sync & Async** - Choose your style  
✅ **Error Handling** - Comprehensive exceptions  
✅ **Auto Retry** - Exponential backoff  
✅ **Type Safe** - Full type hints  
✅ **Well Tested** - 95%+ coverage  

---

## 📚 Documentation

- **Quick Start:** [`docs/API_CLIENT_QUICKSTART.md`](docs/API_CLIENT_QUICKSTART.md)
- **Complete Guide:** [`docs/API_CLIENT_GUIDE.md`](docs/API_CLIENT_GUIDE.md)
- **Examples:** `examples/api_client_*.py`

---

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/chat` | POST | Chat completions |
| `/api/v1/generate` | POST | Text generation |
| `/api/v1/embed` | POST | Text embeddings |
| `/api/v1/models` | GET | List models |

**Base URL:** `https://bleujs.org`

---

## 💡 Examples

### Synchronous

```python
from bleu_ai.api_client import BleuAPIClient

with BleuAPIClient() as client:
    response = client.chat([
        {"role": "user", "content": "Hello!"}
    ])
    print(response.content)
```

### Asynchronous

```python
import asyncio
from bleu_ai.api_client import AsyncBleuAPIClient

async def main():
    async with AsyncBleuAPIClient() as client:
        response = await client.chat([
            {"role": "user", "content": "Hello!"}
        ])
        print(response.content)

asyncio.run(main())
```

### Error Handling

```python
from bleu_ai.api_client import (
    BleuAPIClient,
    AuthenticationError,
    RateLimitError
)

try:
    client = BleuAPIClient()
    response = client.chat([...])
except AuthenticationError:
    print("Invalid API key")
except RateLimitError:
    print("Rate limit exceeded")
```

---

## 🎯 Installation Options

```bash
# API client only
pip install bleu-js[api]

# API + ML
pip install bleu-js[api,ml]

# API + Quantum
pip install bleu-js[api,quantum]

# Everything
pip install bleu-js[all]
```

---

## 🔑 Authentication

Get your API key from [bleujs.org](https://bleujs.org):

```bash
export BLEUJS_API_KEY="bleujs_sk_your_key_here"
```

---

## ⚙️ Configuration

```python
client = BleuAPIClient(
    api_key="bleujs_sk_...",       # API key
    base_url="https://bleujs.org",  # Base URL
    timeout=60.0,                   # Timeout (seconds)
    max_retries=3                   # Max retries
)
```

---

## 📦 Dependencies

The API client requires:
- `httpx>=0.24.0` - HTTP client with async support
- `pydantic>=2.0.0` - Data validation

These are automatically installed with `pip install bleu-js[api]`.

---

## 🧪 Testing

```bash
# Install with dev dependencies
pip install bleu-js[api,dev]

# Run tests
pytest tests/test_api_client.py -v

# With coverage
pytest tests/test_api_client.py --cov=bleu_ai.api_client
```

---

## 📖 Full Documentation

See the complete guides:

1. **[Quick Start Guide](docs/API_CLIENT_QUICKSTART.md)** - Get started in 5 minutes
2. **[Complete API Guide](docs/API_CLIENT_GUIDE.md)** - Full reference and examples
3. **[Integration Summary](API_CLIENT_INTEGRATION_COMPLETE.md)** - Technical details

---

## 🎓 Learn More

### Examples
- `examples/api_client_basic.py` - Basic usage
- `examples/api_client_async.py` - Async patterns
- `examples/api_client_advanced.py` - Advanced features

### Resources
- **Website:** https://bleujs.org
- **GitHub:** https://github.com/HelloblueAI/Bleu.js
- **Support:** support@helloblue.ai

---

## 🐛 Troubleshooting

### "httpx is required"
```bash
pip install bleu-js[api]
```

### "Invalid API key"
Check your environment variable:
```bash
echo $BLEUJS_API_KEY
```

### Rate Limits
```python
client = BleuAPIClient(max_retries=5)
```

### Timeouts
```python
client = BleuAPIClient(timeout=120.0)
```

---

## 🎉 What's New in v1.2.0

✨ **NEW: API Client**
- Sync and async clients
- Full error handling
- Automatic retries
- Type-safe models
- Comprehensive tests
- Complete documentation

---

## 📊 Status

- **Version:** 1.2.0
- **Status:** ✅ Production Ready
- **Test Coverage:** 95%+
- **Documentation:** Complete
- **Examples:** 3 full examples

---

## 🙏 Feedback

We'd love to hear from you!

- **Issues:** https://github.com/HelloblueAI/Bleu.js/issues
- **Discussions:** https://github.com/HelloblueAI/Bleu.js/discussions
- **Email:** support@helloblue.ai

---

## 📝 License

MIT License - See [LICENSE.md](LICENSE.md) for details

---

**Start building with Bleu.js API today! 🚀**

```bash
pip install bleu-js[api]
```


# Bleu.js - Quick Start

## 🚀 Installation

### Simple (as promoted on bleujs.org):

```bash
pip install bleu-js
```

That's it! ✅

---

## 📦 What You Get

With `pip install bleu-js` you get:
- ✅ Core Bleu.js functionality
- ✅ BleuJS main class
- ✅ Utilities and helpers
- ✅ Basic ML capabilities
- ✅ Quantum features (with optional extras)

---

## 💡 Quick Example

```python
from bleujs import BleuJS

# Create instance
bleu = BleuJS()

# Process data
result = bleu.process({'data': [1, 2, 3]})
print(result)
```

---

## 🔌 Optional Features

Want more? Add optional extras:

```bash
# For API client
pip install bleu-js[api]

# For machine learning
pip install bleu-js[ml]

# For quantum computing
pip install bleu-js[quantum]

# For deep learning
pip install bleu-js[deep]

# For everything
pip install bleu-js[all]
```

---

## 📖 API Client Example

If you installed with `[api]`:

```python
from bleujs.api_client import BleuAPIClient

client = BleuAPIClient(api_key="bleujs_sk_...")
response = client.chat([{"role": "user", "content": "Hello!"}])
print(response.content)
```

---

## 📚 Documentation

- **Full Guide:** `docs/INSTALLATION_FOR_USERS.md`
- **API Guide:** `docs/api/API_CLIENT_GUIDE.md`
- **Examples:** `examples/`
- **Website:** https://bleujs.org

---

## 🆘 Need Help?

- **GitHub:** https://github.com/HelloblueAI/Bleu.js
- **Issues:** https://github.com/HelloblueAI/Bleu.js/issues
- **Email:** support@helloblue.ai

---

## ✨ That's It!

```bash
pip install bleu-js
```

**Simple. Powerful. Ready.** 🚀

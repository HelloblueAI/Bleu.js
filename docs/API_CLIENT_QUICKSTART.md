# Bleu.js API Client - Quick Start

Get started with the Bleu.js API client in 5 minutes! 🚀

---

## 📦 Step 1: Install

```bash
pip install bleu-js[api]
```

---

## 🔑 Step 2: Get API Key

1. Visit [bleujs.org](https://bleujs.org)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy your key (starts with `bleujs_sk_...`)

---

## 🔐 Step 3: Set API Key

```bash
export BLEUJS_API_KEY="bleujs_sk_your_api_key_here"
```

Or add to your `~/.bashrc` or `~/.zshrc`:
```bash
echo 'export BLEUJS_API_KEY="bleujs_sk_..."' >> ~/.bashrc
source ~/.bashrc
```

---

## 💬 Step 4: Your First Chat

Create a file `test_chat.py`:

```python
from bleu_ai.api_client import BleuAPIClient

# Create client
client = BleuAPIClient()

# Chat
response = client.chat([
    {"role": "user", "content": "Hello! What can you do?"}
])

# Print response
print(response.content)

# Clean up
client.close()
```

Run it:
```bash
python test_chat.py
```

---

## ✨ Step 5: Try More Features

### Text Generation

```python
response = client.generate(
    prompt="Write a haiku about AI:",
    max_tokens=50
)
print(response.text)
```

### Embeddings

```python
response = client.embed([
    "Artificial intelligence",
    "Machine learning",
    "Deep learning"
])

for i, embedding in enumerate(response.embeddings):
    print(f"Text {i+1}: dimension {len(embedding)}")
```

### List Models

```python
models = client.list_models()

for model in models:
    print(f"• {model.id}: {model.description}")
```

---

## 🎯 Best Practices

### Use Context Manager

```python
with BleuAPIClient() as client:
    response = client.chat([...])
    print(response.content)
# Automatically cleaned up
```

### Handle Errors

```python
from bleu_ai.api_client import AuthenticationError, RateLimitError

try:
    response = client.chat([...])
except AuthenticationError:
    print("Check your API key")
except RateLimitError:
    print("Rate limit - wait a bit")
```

### Track Usage

```python
response = client.chat([...])

if response.usage:
    print(f"Tokens used: {response.usage['total_tokens']}")
```

---

## ⚡ Async Usage

For async applications:

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

---

## 📚 Next Steps

1. **Read the full guide:** [`docs/API_CLIENT_GUIDE.md`](API_CLIENT_GUIDE.md)
2. **Check examples:** `examples/api_client_*.py`
3. **Visit docs:** https://bleujs.org/docs
4. **Join community:** https://discord.gg/bleujs

---

## 🆘 Need Help?

- **Documentation:** https://bleujs.org/docs
- **GitHub Issues:** https://github.com/HelloblueAI/Bleu.js/issues
- **Email:** support@helloblue.ai
- **Discord:** https://discord.gg/bleujs

---

## 🎉 You're Ready!

You now have everything you need to use the Bleu.js API!

**Happy building! 🚀**


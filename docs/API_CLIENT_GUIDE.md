# Bleu.js API Client Guide

Complete guide to using the Bleu.js API client to access the cloud API at bleujs.org.

---

## 📦 Installation

Install the API client feature:

```bash
pip install bleu-js[api]
```

This installs:
- `httpx>=0.24.0` - For HTTP requests with async support
- `pydantic>=2.0.0` - For data validation

---

## 🔑 Authentication

Get your API key from [bleujs.org](https://bleujs.org) and set it as an environment variable:

```bash
export BLEUJS_API_KEY="bleujs_sk_your_api_key_here"
```

Or pass it directly when creating the client:

```python
from bleu_ai.api_client import BleuAPIClient

client = BleuAPIClient(api_key="bleujs_sk_...")
```

---

## 🚀 Quick Start

### Basic Chat Completion

```python
from bleu_ai.api_client import BleuAPIClient

client = BleuAPIClient()

response = client.chat([
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is quantum computing?"}
])

print(response.content)
```

### Text Generation

```python
response = client.generate(
    prompt="Write a haiku about AI:",
    temperature=0.8,
    max_tokens=100
)

print(response.text)
```

### Text Embeddings

```python
response = client.embed([
    "Quantum computing uses quantum mechanics",
    "Machine learning is a subset of AI"
])

embeddings = response.embeddings
print(f"Embedding dimension: {len(embeddings[0])}")
```

### List Available Models

```python
models = client.list_models()

for model in models:
    print(f"{model.id}: {model.description}")
```

---

## ⚡ Async Client

For asynchronous operations, use `AsyncBleuAPIClient`:

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

### Concurrent Requests

```python
async with AsyncBleuAPIClient() as client:
    # Make multiple requests concurrently
    tasks = [
        client.chat([{"role": "user", "content": f"Tell me about {topic}"}])
        for topic in ["Python", "JavaScript", "Rust"]
    ]
    
    responses = await asyncio.gather(*tasks)
    
    for response in responses:
        print(response.content)
```

---

## 🔧 Configuration

### Custom Configuration

```python
client = BleuAPIClient(
    api_key="bleujs_sk_...",
    base_url="https://bleujs.org",  # Custom base URL
    timeout=30.0,                    # Request timeout (seconds)
    max_retries=5                    # Max retry attempts
)
```

### Environment Variables

- `BLEUJS_API_KEY` - Your API key
- `BLEUJS_BASE_URL` - Custom base URL (optional)

---

## 📡 API Endpoints

### 1. Chat Completion

**Endpoint:** `POST /api/v1/chat`

```python
response = client.chat(
    messages=[
        {"role": "system", "content": "You are helpful."},
        {"role": "user", "content": "Hello!"}
    ],
    model="bleu-chat-v1",
    temperature=0.7,
    max_tokens=None,
    top_p=1.0
)
```

**Parameters:**
- `messages` (list) - Conversation history
- `model` (str) - Model to use (default: "bleu-chat-v1")
- `temperature` (float) - Sampling temperature 0-2 (default: 0.7)
- `max_tokens` (int) - Maximum tokens to generate (optional)
- `top_p` (float) - Nucleus sampling parameter (default: 1.0)

**Response:**
```python
{
    "id": "chat-123",
    "model": "bleu-chat-v1",
    "choices": [
        {
            "message": {
                "role": "assistant",
                "content": "Hello! How can I help?"
            }
        }
    ],
    "usage": {
        "prompt_tokens": 20,
        "completion_tokens": 10,
        "total_tokens": 30
    }
}
```

### 2. Text Generation

**Endpoint:** `POST /api/v1/generate`

```python
response = client.generate(
    prompt="Once upon a time",
    model="bleu-gen-v1",
    temperature=0.7,
    max_tokens=256,
    top_p=1.0,
    top_k=50,
    stop=["\n\n"]
)
```

**Parameters:**
- `prompt` (str) - Text prompt
- `model` (str) - Model to use (default: "bleu-gen-v1")
- `temperature` (float) - Sampling temperature 0-2
- `max_tokens` (int) - Maximum tokens (default: 256)
- `top_p` (float) - Nucleus sampling (default: 1.0)
- `top_k` (int) - Top-k sampling (default: 50)
- `stop` (list) - Stop sequences (optional)

**Response:**
```python
{
    "id": "gen-123",
    "model": "bleu-gen-v1",
    "text": "Once upon a time in a land far away...",
    "finish_reason": "stop",
    "usage": {...}
}
```

### 3. Embeddings

**Endpoint:** `POST /api/v1/embed`

```python
response = client.embed(
    texts=["text1", "text2", "text3"],
    model="bleu-embed-v1",
    encoding_format="float"
)
```

**Parameters:**
- `texts` (list) - List of texts to embed (max 100)
- `model` (str) - Model to use (default: "bleu-embed-v1")
- `encoding_format` (str) - "float" or "base64" (default: "float")

**Response:**
```python
{
    "object": "list",
    "model": "bleu-embed-v1",
    "data": [
        {"embedding": [0.1, 0.2, ...], "index": 0},
        {"embedding": [0.3, 0.4, ...], "index": 1}
    ],
    "usage": {...}
}
```

### 4. List Models

**Endpoint:** `GET /api/v1/models`

```python
models = client.list_models()
```

**Response:**
```python
[
    {
        "id": "bleu-chat-v1",
        "object": "model",
        "created": 1234567890,
        "owned_by": "bleujs",
        "capabilities": ["chat", "completion"],
        "description": "Chat model with quantum enhancements"
    },
    ...
]
```

---

## ⚠️ Error Handling

The client provides specific exception types for different errors:

```python
from bleu_ai.api_client import (
    BleuAPIError,           # Base exception
    AuthenticationError,    # 401 - Invalid API key
    RateLimitError,        # 429 - Rate limit exceeded
    InvalidRequestError,    # 400 - Bad request
    APIError,              # 500+ - Server error
    NetworkError,          # Network/timeout issues
    ValidationError        # Client-side validation
)
```

### Example Error Handling

```python
try:
    response = client.chat([
        {"role": "user", "content": "Hello!"}
    ])
    print(response.content)

except AuthenticationError:
    print("Invalid API key")

except RateLimitError:
    print("Rate limit exceeded - wait and retry")

except InvalidRequestError as e:
    print(f"Invalid request: {e}")

except APIError:
    print("Server error - try again later")

except NetworkError:
    print("Network error - check connection")

except BleuAPIError as e:
    print(f"API error: {e}")
```

---

## 🔄 Retry Logic

The client automatically retries failed requests with exponential backoff:

```python
client = BleuAPIClient(
    api_key="bleujs_sk_...",
    max_retries=3  # Retry up to 3 times
)
```

### Manual Retry with Custom Logic

```python
import time

def chat_with_retry(client, messages, max_attempts=3):
    for attempt in range(max_attempts):
        try:
            return client.chat(messages)
        except RateLimitError:
            if attempt < max_attempts - 1:
                wait_time = 2 ** attempt
                print(f"Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise
```

---

## 🎯 Best Practices

### 1. Use Context Manager

```python
# Ensures proper cleanup
with BleuAPIClient() as client:
    response = client.chat([...])
    # Client automatically closed
```

### 2. Handle Errors Gracefully

```python
def safe_api_call(client, func, *args, **kwargs):
    try:
        return func(*args, **kwargs)
    except BleuAPIError as e:
        print(f"Error: {e}")
        return None
```

### 3. Track Usage

```python
class UsageTracker:
    def __init__(self):
        self.total_tokens = 0
    
    def track(self, response):
        if hasattr(response, 'usage') and response.usage:
            self.total_tokens += response.usage.get('total_tokens', 0)
```

### 4. Use Async for Concurrency

```python
# Process multiple requests in parallel
async with AsyncBleuAPIClient() as client:
    tasks = [client.generate(prompt) for prompt in prompts]
    results = await asyncio.gather(*tasks)
```

### 5. Set Reasonable Timeouts

```python
client = BleuAPIClient(
    timeout=30.0,      # 30 seconds
    max_retries=3      # 3 retry attempts
)
```

---

## 📊 Response Objects

### ChatCompletionResponse

```python
response = client.chat([...])

# Access methods
response.id           # Completion ID
response.model        # Model used
response.choices      # List of choices
response.content      # First choice content (convenience)
response.usage        # Token usage stats
```

### GenerationResponse

```python
response = client.generate("prompt")

response.id                # Generation ID
response.text              # Generated text
response.finish_reason     # Why generation stopped
response.usage             # Token usage
```

### EmbeddingResponse

```python
response = client.embed(["text1", "text2"])

response.data              # Raw embedding data
response.embeddings        # List of float vectors (convenience)
response.model             # Model used
```

### Model

```python
models = client.list_models()

for model in models:
    model.id              # Model identifier
    model.description     # Description
    model.capabilities    # List of capabilities
    model.context_length  # Max context length
```

---

## 🔍 Advanced Examples

### Streaming Simulation

```python
def simulate_streaming(client, messages):
    response = client.chat(messages)
    words = response.content.split()
    for word in words:
        print(word, end=" ", flush=True)
        time.sleep(0.1)
```

### Batch Processing

```python
def process_batch(client, prompts):
    results = []
    for prompt in prompts:
        try:
            response = client.generate(prompt)
            results.append(response.text)
        except Exception as e:
            print(f"Error: {e}")
            results.append(None)
    return results
```

### Conversation Management

```python
class Conversation:
    def __init__(self, client):
        self.client = client
        self.messages = []
    
    def add_message(self, role, content):
        self.messages.append({"role": role, "content": content})
    
    def send(self):
        response = self.client.chat(self.messages)
        self.add_message("assistant", response.content)
        return response.content

# Usage
conv = Conversation(client)
conv.add_message("user", "Hello!")
reply = conv.send()
print(reply)
```

---

## 🧪 Testing

### Unit Tests

```python
import pytest
from unittest.mock import Mock, patch
from bleu_ai.api_client import BleuAPIClient

@patch('httpx.Client.request')
def test_chat(mock_request):
    mock_request.return_value = Mock(
        status_code=200,
        json=lambda: {
            "id": "chat-123",
            "model": "bleu-chat-v1",
            "choices": [{
                "message": {"role": "assistant", "content": "Hi"}
            }]
        }
    )
    
    client = BleuAPIClient(api_key="test_key")
    response = client.chat([{"role": "user", "content": "Hello"}])
    
    assert response.content == "Hi"
```

### Integration Tests

```python
def test_real_api():
    """Test against real API (requires valid API key)"""
    client = BleuAPIClient()
    
    response = client.chat([
        {"role": "user", "content": "Say 'test'"}
    ])
    
    assert "test" in response.content.lower()
```

---

## 📚 Additional Resources

- **API Documentation:** https://bleujs.org/docs
- **GitHub Repository:** https://github.com/HelloblueAI/Bleu.js
- **Examples:** Check `examples/api_client_*.py`
- **Support:** support@helloblue.ai

---

## 🐛 Troubleshooting

### "httpx is required" Error

```bash
pip install bleu-js[api]
```

### "Invalid API key" Error

Check that your API key is correctly set:
```bash
echo $BLEUJS_API_KEY
```

### Rate Limit Errors

Implement backoff logic:
```python
client = BleuAPIClient(max_retries=5)
```

### Timeout Errors

Increase timeout:
```python
client = BleuAPIClient(timeout=60.0)
```

### Network Errors

Check your internet connection and firewall settings.

---

## 📝 Changelog

### v1.2.1 (November 2025)
- ✅ Updated to match Bleu.js 1.2.1 packaging and version headers
- ✅ Confirmed Python 3.12 / Pydantic v2 compatibility
- ✅ API client now ships by default in every distribution
- ✅ Documentation & examples refreshed with latest install commands

### v1.2.0 (October 2025)
- ✅ Initial API client release
- ✅ Sync and async support
- ✅ Chat, generation, and embeddings
- ✅ Comprehensive error handling
- ✅ Automatic retry logic
- ✅ Full test coverage
- ✅ Complete documentation

---

**Happy coding with Bleu.js! 🚀**


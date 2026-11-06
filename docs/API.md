# Bleu.js hosted API

This page describes the current Developer API surface used by the SDK and CLI.
For request and response details, use the machine-readable
[OpenAPI contract](api/openapi.yaml) and the [API Client Guide](API_CLIENT_GUIDE.md).

For how the Developer API differs from website assistants, local utilities, and
test stubs, see [API, assistants, and local utilities](WHO_SERVES_THE_API.md).

## Base URL and authentication

- Base URL: `https://api.bleujs.org`
- Canonical path prefix: `/api/v1`
- Auth header: `Authorization: Bearer <BLEUJS_API_KEY>`
- Python SDK: pass `api_key=...` or set `BLEUJS_API_KEY`
- CLI: set `BLEUJS_API_KEY` or run `bleu config set api-key <key>`

Do not use the old `api.bleujs.com` examples or `/v1/*` paths from historical
notes. Current examples should use `https://api.bleujs.org/api/v1/*`.

## Current endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/health` | `GET` | API health check |
| `/api/v1/chat` | `POST` | Chat completion |
| `/api/v1/generate` | `POST` | Text generation |
| `/api/v1/embed` | `POST` | Text embeddings |
| `/api/v1/models` | `GET` | List models |

## Quick start with curl

```bash
export BLEUJS_API_KEY="bleujs_sk_your_key_here"

curl https://api.bleujs.org/api/v1/chat \
  -H "Authorization: Bearer $BLEUJS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Say hello in one word."}],
    "max_tokens": 50
  }'
```

## Python SDK

```python
from bleujs.api_client import BleuAPIClient

client = BleuAPIClient()  # reads BLEUJS_API_KEY
response = client.chat([{"role": "user", "content": "Hello!"}])
print(response.content)
```

To avoid an environment variable, pass the key directly:

```python
client = BleuAPIClient(api_key="bleujs_sk_...")
```

## JavaScript / TypeScript

```javascript
const res = await fetch("https://api.bleujs.org/api/v1/chat", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.BLEUJS_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Hello!" }],
    max_tokens: 50,
  }),
});

const data = await res.json();
console.log(data.choices?.[0]?.message?.content);
```

## What this page does not define

- Pricing, trial, allowance, rate-limit, or payment terms. Use
  [bleujs.org/pricing](https://bleujs.org/pricing) for current public terms.
- Website assistant setup or widget limits. Use
  [bleujs.org/enterprise-ai-agents](https://bleujs.org/enterprise-ai-agents).
- Self-hosted server deployment. See [INSTALLATION.md](INSTALLATION.md).

## Historical content

Older revisions of this page mentioned `api.bleujs.com`, placeholder
`/v1/endpoint` examples, and Basic/Enterprise plan numbers. Treat those as
historical notes only; they are not the current Developer API contract.

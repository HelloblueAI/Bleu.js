# Get started with Bleu.js

Get from zero to your first API call in under two minutes.

---

## Right after install (no API key needed)

As soon as `pip install bleu-js` finishes, you can run:

- **`bleu --help`** — see all commands and a short “Get started” hint.
- **`bleu version`** — see CLI version (e.g. `Bleu CLI v1.3.59`).

To call the cloud API (chat, generate, embed, etc.), you’ll need an API key from [bleujs.org](https://bleujs.org). If you run e.g. `bleu chat "Hi"` without a key, the CLI will tell you to set one and point you to bleujs.org.

---

## 1. Install

**Requirement:** Python 3.11 or newer.

```bash
pip install bleu-js
```

This installs the **cloud API client** and **CLI** only (small download, no PyTorch/quantum libs). Add extras later if you need them: `[ml]`, `[quantum]`, `[deep]`, or `[all]`.

---

## 2. Get an API key

1. Go to **[bleujs.org](https://bleujs.org)** and sign up or log in.
2. Create or copy an API key (starts with `bleujs_sk_...`).

---

## 3. Set your API key

**Option A – Environment variable (good for scripts and CI):**

```bash
export BLEUJS_API_KEY="bleujs_sk_your_key_here"
```

**Option B – CLI config (good for interactive use):**

```bash
bleu config set api-key bleujs_sk_your_key_here
```

This saves the key in **`~/.bleujs/config.json`** so you don’t need to set the environment variable each time.

---

## 4. Run your first commands

### From the command line

```bash
bleu chat "Say hello in one word."
```

### From Python

```python
from bleujs.api_client import BleuAPIClient

client = BleuAPIClient()  # uses BLEUJS_API_KEY if set
print(client.chat([{"role": "user", "content": "Say hello in one word."}]).content)
```

If you see a short reply from the model, you’re set.

---

## Verify installation (optional)

```bash
bleu version
bleu health
```

`bleu health` checks connectivity to the Bleu.js API.

---

## What’s next?

| Goal | Link |
|------|------|
| **Quick reference** (SDK + CLI) | [QUICKSTART.md](QUICKSTART.md) |
| **Full API & CLI docs** | [API_CLIENT_GUIDE.md](API_CLIENT_GUIDE.md) |
| **Install extras** (ML, quantum, etc.) | [INSTALLATION.md](INSTALLATION.md) |
| **Run examples** | `examples/api_client_basic.py` (needs API key) |

---

## Troubleshooting

| Issue | Fix |
|--------|-----|
| **“API key not found”** | Set `BLEUJS_API_KEY` or run `bleu config set api-key <key>`. Get a key at [bleujs.org](https://bleujs.org). |
| **“API client not available”** | Run `pip install bleu-js` (default install includes the client). |
| **Python &lt; 3.11** | Install Python 3.11+ from [python.org](https://www.python.org/downloads/) or your package manager. |

---

## Self-hosting (run your own server)

If you want to run the Bleu.js **app** (API server + dashboard) yourself instead of using bleujs.org, see [INSTALLATION.md](INSTALLATION.md) for clone, `.env`, database, and `uvicorn` setup. Most users only need `pip install bleu-js` and an API key from bleujs.org.

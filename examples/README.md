# Bleu.js Examples

Run these after `pip install bleu-js`. Use Python 3.11+.

---

## Cloud API (needs API key)

Set your key first: `export BLEUJS_API_KEY=bleujs_sk_...` or get one at [bleujs.org](https://bleujs.org).

| File | What it does |
|------|----------------|
| **api_client_basic.py** | Chat, generate, embed, list models. **Start here for API.** |
| **api_client_advanced.py** | More options and patterns. |
| **api_client_async.py** | Async client with `AsyncBleuAPIClient`. |

```bash
export BLEUJS_API_KEY=bleujs_sk_your_key
python examples/api_client_basic.py
```

---

## Local processing (no API key)

These use the local BleuJS engine. No account or API key needed.

| File | What it does |
|------|----------------|
| **quick_start.py** | Basic BleuJS, `process()`, device detection. **Start here for local.** |
| **quantum_example.py** | Quantum features (install `bleu-js[quantum]` for full support). |
| **ml_example.py** | ML training (install `bleu-js[ml]`). |

```bash
python examples/quick_start.py
```

---

## Other

| File | What it does |
|------|----------------|
| **sample_usage.py** | General usage patterns. |
| **mps_acceleration_demo.py** | MPS acceleration (e.g. Apple Silicon). |
| **ci_cd_demo.py** | CI/CD-style usage. |

---

**First time?** Use [Get started](../docs/GET_STARTED.md) for install → API key → first command.

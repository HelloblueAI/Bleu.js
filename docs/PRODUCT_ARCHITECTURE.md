# Product architecture

This repository is the open-source Bleu.js SDK, CLI, API contract, and optional self-hosted app.

## What is in this repo

| Component | Purpose | Location |
| --------- | ------- | -------- |
| **Python SDK** | `BleuAPIClient`, `AsyncBleuAPIClient` | `src/bleujs/api_client/`, PyPI `bleu-js` |
| **Bleu CLI** | `bleu` / `bleujs` (for example `bleu chat`, `bleu health`) | `src/bleujs/cli.py`, PyPI `bleu-js` |
| **API contract** | Public request and response shapes | `docs/api/openapi.yaml` |
| **Edge stub** | Local and CI stand-in for the contract | `services/edge-stub/` |
| **Self-hosted app** | Optional FastAPI app (dashboard and API routes) | `src/main.py` |
| **PyPI package** | Install and extras | `bleu-js` with `[api]`, `[ml]`, `[quantum]` |

The SDK and CLI call `https://api.bleujs.org` unless `BLEUJS_BASE_URL` is set. That hostname is the public API. This repository does not describe how the hosted service is deployed.

## Run the self-hosted app

```bash
# From the repo root. Install deps first: poetry install  OR  pip install -e ".[server]"
python main.py
# Or with reload: BLEUJS_RELOAD=1 python main.py
# Or via uvicorn: python -m uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
```

Then open `http://localhost:8000` (docs at `/docs`). Copy `.env.example` to `.env` and set `SECRET_KEY` and `DATABASE_URL`. See [SECURITY](../SECURITY.md).

`python main.py` runs `src/main.py`. Set `BLEUJS_LEGACY_BACKEND=1` only if you intentionally want the older in-repo ML entry point.

## Quantum and ML libraries

Quantum and ML modules are optional extras (`[ml]`, `[quantum]`). They are part of the open-source package. They are not a map of the hosted service.

## Docs for contributors

- [README](../README.md) — install, SDK, and CLI
- [Platform overview](PLATFORM_OVERVIEW.md) — features and local development
- [API Client Guide](API_CLIENT_GUIDE.md) — SDK and API contract
- [Installation](INSTALLATION.md) — install and self-host
- [Changing the API](CHANGING_THE_API.md) — how to change the public contract
- [SECURITY](../SECURITY.md) — reporting vulnerabilities

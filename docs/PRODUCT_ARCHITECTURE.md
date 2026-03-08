# Product architecture — HelloBlue Inc.

**One product surface.** This doc defines what is the shipped product vs internal/legacy.

## The product (bleujs.org / PyPI)

| Component | Purpose | Entry / location |
|-----------|---------|------------------|
| **Cloud API** | Chat, generate, embed, models, subscriptions, API keys | Served by **`src/main.py`** (FastAPI app) |
| **Web dashboard** | Sign up, login, usage, subscriptions, API keys | Same app — routes and templates under `src/` |
| **Python SDK** | `BleuAPIClient`, `AsyncBleuAPIClient` | `src/bleujs/api_client/`, PyPI `bleu-js[api]` |
| **Bleu CLI** | `bleu chat`, `generate`, `embed`, `models` | `src/bleujs/cli.py`, PyPI `bleu-js[api]` |
| **PyPI package** | Install and upgrades | `bleu-js` with extras `[api]`, `[ml]`, `[quantum]` |

**Canonical app for the product:** `src/main.py`. This is what runs at bleujs.org (dashboard, auth, subscription, AI routes).

## Other apps (internal / legacy / alternate)

- **Root `main.py`** — Uses `src.python.backend` (different stack). Alternate entry; not the bleujs.org product app.
- **`src/python/backend/main.py`** — Second FastAPI app (different config, router). Internal/ML backend; not the public API app.
- **`src/api/main.py`**, **`src/api/application.py`** — Alternate API mounts; product routes are wired through `src/main.py`.
- **Backend repo** — Node/Express backend lives in a [separate repo](BACKEND_REPO.md); inference/ML services. Not in this repo.

Use **`src/main.py`** for the public product (dashboard + API). Use the others only if you have a specific deployment or internal need.

## Docs that matter for the product

- [README](../README.md) — Quick start, SDK, CLI, install
- [API Client Guide](API_CLIENT_GUIDE.md) — SDK and API contract
- [Installation](INSTALLATION.md) — Install and deploy
- [SECURITY](../SECURITY.md) — Reporting, deployment checklist
- [ROADMAP](ROADMAP.md) — Status and roadmap
- [Open source standards](OPEN_SOURCE_STANDARDS.md) — How we run the repo

Older or one-off docs are in [docs/archive/](archive/) for reference.

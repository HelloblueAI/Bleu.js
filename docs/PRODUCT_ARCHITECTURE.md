# Product architecture — HelloBlue Inc.

**One product surface.** This doc defines what is the shipped product vs internal/legacy.

## The product (bleujs.org / PyPI)

| Component         | Purpose                                                | Entry / location                                   |
| ----------------- | ------------------------------------------------------ | -------------------------------------------------- |
| **Cloud API**     | Chat, generate, embed, models, subscriptions, API keys | Served by **`src/main.py`** (FastAPI app)          |
| **Web dashboard** | Sign up, login, usage, subscriptions, API keys         | Same app — routes and templates under `src/`       |
| **Python SDK**    | `BleuAPIClient`, `AsyncBleuAPIClient`                  | `src/bleujs/api_client/`, PyPI `bleu-js`           |
| **Bleu CLI**      | `bleu chat`, `generate`, `embed`, `models`             | `src/bleujs/cli.py`, PyPI `bleu-js`                |
| **PyPI package**  | Install and upgrades                                   | `bleu-js` with extras `[api]`, `[ml]`, `[quantum]` |

**Canonical app for the product:** `src/main.py`. This is what runs at bleujs.org (dashboard, auth, subscription, AI routes).

## Single entry point from repo root

**Run the product app:** From repo root, `python main.py` (or `python -m uvicorn src.main:app --reload`). Root `main.py` runs the product app by default. For the legacy ML/internal backend only, set `BLEUJS_LEGACY_BACKEND=1` before running `python main.py`.

## Other apps (internal / legacy / alternate)

- **`src/python/backend/main.py`** — Internal/ML FastAPI app (different config, router). Not the bleujs.org product app; use only if you need this stack.
- **`src/api/main.py`**, **`src/api/application.py`** — Alternate API mounts; product routes are wired through `src/main.py`.
- **Backend repo** — Node/Express backend lives in a [separate repo](BACKEND_REPO.md); inference/ML services. Not in this repo.

Use **`python main.py`** or **`src/main.py`** for the public product (dashboard + API).

**Stubs / optional modules:** Some modules (e.g. quantum, ML, automation) are optional or stubs; the product surface is the Cloud API, SDK, and CLI. Install extras `[api]`, `[ml]`, `[quantum]` as needed; see [INSTALLATION](INSTALLATION.md).

## Quantum & ML in the product

- **Product:** The cloud API (bleujs.org) and SDK expose quantum-enhanced and ML capabilities as part of the paid offering (e.g. models, features). That is the shipped product.
- **R&D / optional:** The repo also contains quantum and ML libraries (e.g. teleportation, quantum_ml, error correction) used for research or advanced installs. They are part of the PyPI extras `[ml]` and `[quantum]`; the main revenue surface is the **API + subscriptions** at bleujs.org.

## Run the product app locally

```bash
# From repo root. Install deps first: poetry install  OR  pip install -e ".[server]"
python main.py
# Or with reload: BLEUJS_RELOAD=1 python main.py
# Or via uvicorn: python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Then open `http://localhost:8000` (dashboard, docs at `/docs`). Set env (e.g. `.env`) for `SECRET_KEY`, `DATABASE_URL`, etc.; see [SECURITY](../SECURITY.md) and `.env.example`.

## Docs that matter for the product

- [README](../README.md) — Quick start, SDK, CLI, install
- [API Client Guide](API_CLIENT_GUIDE.md) — SDK and API contract
- [Installation](INSTALLATION.md) — Install and deploy
- [SECURITY](../SECURITY.md) — Reporting, deployment checklist
- [ROADMAP](ROADMAP.md) — Status and roadmap
- [Repositories and sync](REPOSITORIES.md) — How the two repos work together

Older or one-off docs are in [docs/archive/](archive/) for reference.

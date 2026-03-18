# Deployment practices — Are we doing it right?

Short assessment of how our Railway + Docker setup lines up with common “big tech” patterns.

## What we’re doing correctly

| Practice | What we do |
|----------|------------|
| **Port from env** | Container listens on `0.0.0.0:$PORT` (Railway sets `PORT`). Matches 12‑factor and PaaS expectations. |
| **Health checks** | `GET /health` returns 200. Railway’s `healthcheckPath: "/health"` is used. Standard for load balancers and orchestrators. |
| **One process per container** | Entrypoint runs Bleu OS init, then `exec` into a single long‑lived process (uvicorn). No background daemons; one PID. |
| **Non-root user** | Image runs as `bleuos`, not root. Good for security and common in production images. |
| **GitHub → deploy** | Push to `main` triggers Railway. Same idea as “push to main → CI → deploy” used elsewhere. |
| **Config from env** | No hardcoded ports; `PORT` (and other env) come from the platform. |
| **Reproducible base** | Bleujs.-backend pins the Python base image by digest; bleu-os uses a tagged Alpine. Both are reproducible. |

So on port, health, single process, non-root, and CI/CD flow we’re aligned with common practice.

## Current architecture (two deployment targets)

1. **Bleu.js repo → Railway (bleujs-production)**
   - Builds **bleu-os/Dockerfile.production** (Debian-based; see `railway.json`).
   - Runs: Bleu OS init → **full product app** (`uvicorn src.main:app` on `$PORT`).
   - **Result:** Serves the same app as bleujs.org (dashboard + API from `src.main`). Health: `GET /health`. Set `DATABASE_URL` (and other app settings) in Railway.

2. **Bleujs.-backend repo**
   - Builds its own Dockerfile.
   - Runs **predict_api** (FastAPI with `/`, `/predict`).
   - **Result:** Dedicated prediction API; can be deployed as a separate service (e.g. second Railway service or separate URL).

So: **bleujs-production** serves the full product app; the prediction API remains a separate service when used.

## How “big tech” usually does it

- **One URL, one app:** The public URL (e.g. bleujs.org / bleujs-production) serves the **actual product** (dashboard + API from `src.main:app`), not a minimal stub.
- **Optional separate services:** Heavy or specialized workloads (e.g. ML inference) often run in a separate service (e.g. Bleujs.-backend for `/predict`), with the main app proxying or calling it. We already have that split in repos; we can keep it.
- **Containers:** One primary process per container; entrypoint can do init then `exec` into the app. We already do that pattern.

## Implemented: full product app on Railway

The **bleu-os** image now runs the real product app (`src.main:app`) on `$PORT`:

- **Dockerfile:** Copies `main.py`, `src/`, `README.md`, and `bleu-os/requirements-server.txt` into `/workspace`, installs server deps (no `ray`; Alpine-compatible), then `CMD` runs `uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}`.
- **Health:** The product app exposes `GET /health`; Railway’s `healthcheckPath: "/health"` works.
- **Env:** Set `DATABASE_URL` (and any other app settings) in Railway for the product app. Use `TESTING=true` only if you want to skip DB init (e.g. minimal health-only deploy).

## Summary

- **We’re doing the mechanics correctly:** PORT from env, health, single process, non-root, GitHub-driven deploy.
- **Architectural choice:** bleujs-production serves the **full product app** (`src.main:app`) on `$PORT`; the prediction API stays in the backend repo as a separate service when needed.

This doc can be updated when you add more services or change deployment targets.

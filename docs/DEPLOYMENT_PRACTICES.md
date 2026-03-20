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
- **Startup resilience knobs:**
  - `DATABASE_CONNECT_TIMEOUT` (default `5`) keeps DB connect failures fast.
  - `FAIL_STARTUP_ON_DB_INIT_ERROR` (default `false`) lets the app boot and serve `/health` during transient DB issues; set to `true` if you require strict fail-fast behavior.
  - Railway `healthcheckTimeout` is set to `300` seconds to reduce cold-start false negatives.

## AI provider failover (revenue readiness)

To serve **real** AI traffic and keep error rate under 2%:

1. **Provider order:** BleuJS → OpenAI → Anthropic → in-process fallback. The app tries each real provider on failure before using the in-process fallback.
2. **Env vars (Railway or .env):**
   - `BLEUJS_BACKEND_URL` — **Optional.** URL of your BleuJS AI backend (e.g. second Railway service). **If you don’t have one, leave it unset;** the app will skip BleuJS and use OpenAI → Anthropic → in-process.
   - `OPENAI_API_KEY` — Optional but recommended. Used when BleuJS is unset or fails. Set this (or Anthropic) so you get real AI without a BleuJS backend.
   - `ANTHROPIC_API_KEY` — Optional. Used when BleuJS and OpenAI are unset or fail.
   - `QUANTUM_SERVICE_URL` — Optional; for health dashboard only. Only set if you have an external service to probe.
3. **Railway with only DATABASE_URL (no BleuJS backend):** You only need `DATABASE_URL` for the app to run. To serve real AI, set **either** `OPENAI_API_KEY` **or** `ANTHROPIC_API_KEY` (or both). The app will use them in order and fall back to in-process only if both fail.
4. **Fixing 502:** Ensure the main app (bleujs-production) is healthy (`GET /health` 200). If the app calls a BleuJS backend that returns 502, set `BLEUJS_BACKEND_URL` to a working backend or rely on failover (OpenAI/Anthropic) until the backend is fixed.
5. **Verification (before selling):**
   - Fix Railway so the app returns 2xx (no 502). Ensure `GET /health` returns 200.
   - Run 100 consecutive **real** AI requests (e.g. `POST /api/v1/chat` with auth). Count how many are served by a real provider (bleujs, openai, anthropic) vs in_process.
   - Require real-AI success rate high enough that error rate for real AI is under 2%. If 100% are in_process, do not claim &lt;2% error for real AI; fix backend and/or env vars first.

## Summary

- **We’re doing the mechanics correctly:** PORT from env, health, single process, non-root, GitHub-driven deploy.
- **Architectural choice:** bleujs-production serves the **full product app** (`src.main:app`) on `$PORT`; the prediction API stays in the backend repo as a separate service when needed.
- **AI:** Provider failover (BleuJS → OpenAI → Anthropic → in-process) is implemented; set env vars so at least one real provider is available.

This doc can be updated when you add more services or change deployment targets.

# Deployment practices — Are we doing it right?

Short assessment of how our Railway + Docker setup lines up with common “big tech” patterns.

## What we’re doing correctly

| Practice | What we do |
|----------|------------|
| **Port from env** | Container listens on `0.0.0.0:$PORT` (Railway sets `PORT`). Matches 12‑factor and PaaS expectations. |
| **Health checks** | `GET /health` returns 200. Railway’s `healthcheckPath: "/health"` is used. Standard for load balancers and orchestrators. |
| **One process per container** | Single long‑lived process (uvicorn). No background daemons; one PID. |
| **Non-root user** | Image runs as `app`, not root. Good for security and common in production images. |
| **GitHub → deploy** | Push to `main` triggers Railway. Same idea as “push to main → CI → deploy” used elsewhere. |
| **Config from env** | No hardcoded ports; `PORT` (and other env) come from the platform. |
| **Reproducible base** | Bleujs.-backend pins the Python base image by digest; this repo uses `debian:bookworm-slim` in the root Dockerfile. |

So on port, health, single process, non-root, and CI/CD flow we’re aligned with common practice.

## Current architecture

1. **bleujs.org → Railway (`bleujs-production.up.railway.app`)**
   - Runs **`ml_engine/server.py`** — production `POST /predict` (XGBoost).
   - Deploy via `bleujs.org` (`scripts/railway_build.sh` / `railway_start.sh`).

2. **bleujs.org → Vercel**
   - Next.js app — production `chat` / `generate` / `embed` via `api.bleujs.org`.

3. **Bleu.js repo (optional self-host)**
   - Root **Dockerfile** can run `src.main:app` (product app) on Railway or elsewhere.
   - **`services/edge-stub/`** — local/CI OpenAPI stub only; not production.

See [Repositories and sync](REPOSITORIES.md) and [Who serves the API](WHO_SERVES_THE_API.md).

## How “big tech” usually does it

- **One URL, one app:** The public URL (e.g. bleujs.org / bleujs-production) serves the **actual product** (dashboard + API from `src.main:app`), not a minimal stub.
- **Optional separate services:** ML inference runs in **bleujs.org `ml_engine`** on Railway; the main Next.js app calls it via `BLEUJS_API_URL`.
- **Containers:** One primary process per container. We use uvicorn as the main process.

## Product app on Railway

The root Docker image runs the real product app (`src.main:app`) on `$PORT`:

- **Dockerfile:** Copies `main.py`, `src/`, `README.md`, and `deploy/requirements-server.txt`, installs server deps, then `CMD` runs `uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}`.
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
   - Require real-AI success rate high enough that error rate for real AI is under 2%. If 100% are in_process, do not claim <2% error for real AI; fix backend and/or env vars first.

## Summary

- **We’re doing the mechanics correctly:** PORT from env, health, single process, non-root, GitHub-driven deploy.
- **Architectural choice:** bleujs-production serves the **full product app** (`src.main:app`) on `$PORT`; the prediction API stays in the backend repo as a separate service when needed.
- **AI:** Provider failover (BleuJS → OpenAI → Anthropic → in-process) is implemented; set env vars so at least one real provider is available.

This doc can be updated when you add more services or change deployment targets.

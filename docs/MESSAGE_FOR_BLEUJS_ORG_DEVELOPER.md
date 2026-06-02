# Message for bleujs.org / frontend developer

**Copy-paste the section below to send to your developer.**

---

## Bleu.js production deploy (Railway) – what changed and what you need to do

**What we fixed**

1. **502 on bleujs-production** – The container runs the **real product app** (`src.main:app`) and listens on `$PORT` via `uvicorn`, so Railway gets a live HTTP server and health checks pass.

2. **Which image Railway uses** – Railway builds the root **[Dockerfile](../Dockerfile)** (Debian bookworm-slim; see `railway.json`). Server deps are in `deploy/requirements-server.txt`.

3. **Health** – The app exposes **`GET /health`**. Railway’s health check uses `/health`, so no change needed on your side for that.

**What you need to do**

1. **Set env in Railway**
   In the Railway project for **bleujs-production** (or whatever service runs the Bleu.js repo), set at least:
   - **`DATABASE_URL`** – Required for the product app (e.g. Postgres connection string). Without it, the app can fail at startup when it runs `init_db()`.
   - Any other env the app expects (e.g. `SECRET_KEY`, `CORS_ORIGINS`, etc.) – same as for a normal deploy of this app.

2. **Optional: `TESTING=true`**
   Only if you want a minimal deploy that skips DB init (e.g. health-only). For the full dashboard + API, **do not** set `TESTING=true`; set a real `DATABASE_URL` instead.

3. **Redeploy**
   After the next push to `main` (or a manual redeploy), Railway will build from the root Dockerfile and run the product app on `$PORT`. The public URL (e.g. `bleujs-production.up.railway.app`) will serve the same app as bleujs.org (dashboard, auth, API, `/health`).

**Summary for the developer**

- **Backend / API:** The container runs the real Bleu.js product app (FastAPI: dashboard, auth, subscriptions, API). It listens on `0.0.0.0:$PORT` and exposes `/` and `/health`.
- **Your frontend (bleujs.org):** Point it at the Railway URL (e.g. `https://bleujs-production.up.railway.app`) for API/docs; no change to the contract. Ensure Railway has `DATABASE_URL` (and any other required env) set so the app starts correctly.

---

## Trivy / Dependabot security alerts

Legacy alerts may still refer to the retired **Bleu OS** images. Dismiss or ignore those as needed, or run `./scripts/dismiss-trivy-code-scanning-alerts.sh --dry-run` then without `--dry-run`.

*(This file can be deleted or kept for reference; it’s for handoff only.)*

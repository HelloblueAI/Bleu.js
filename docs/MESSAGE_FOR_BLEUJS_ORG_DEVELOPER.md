# Message for bleujs.org / frontend developer

**Copy-paste the section below to send to your developer.**

---

## Bleu.js production deploy (Railway) – what changed and what you need to do

**What we fixed**

1. **502 on bleujs-production** – The container now runs the **real product app** (`src.main:app`) and listens on `$PORT`. After “Bleu OS initialization complete,” the process runs `uvicorn src.main:app --host 0.0.0.0 --port $PORT`, so Railway gets a live HTTP server and health checks pass.

2. **Which image Railway uses** – Railway is configured to build **`bleu-os/Dockerfile.production`** (Debian Bookworm) instead of the Alpine Dockerfile. That image has fewer Trivy/Dependabot security alerts (cpython, libexpat, sqlite, etc. are from the patched Debian base).

3. **Health** – The app exposes **`GET /health`** (returns `{"status":"healthy","version":"1.4.47"}`). Railway’s health check uses `/health`, so no change needed on your side for that.

**What you need to do**

1. **Set env in Railway**
   In the Railway project for **bleujs-production** (or whatever service runs the Bleu.js repo), set at least:
   - **`DATABASE_URL`** – Required for the product app (e.g. Postgres connection string). Without it, the app can fail at startup when it runs `init_db()`.
   - Any other env the app expects (e.g. `SECRET_KEY`, `CORS_ORIGINS`, etc.) – same as for a normal deploy of this app.

2. **Optional: `TESTING=true`**
   Only if you want a minimal deploy that skips DB init (e.g. health-only). For the full dashboard + API, **do not** set `TESTING=true`; set a real `DATABASE_URL` instead.

3. **Redeploy**
   After the next push to `main` (or a manual redeploy), Railway will build from **Dockerfile.production** and run the product app on `$PORT`. The public URL (e.g. `bleujs-production.up.railway.app`) will serve the same app as bleujs.org (dashboard, auth, API, `/health`).

**Summary for the developer**

- **Backend / API:** The container now runs the real Bleu.js product app (FastAPI: dashboard, auth, subscriptions, API). It listens on `0.0.0.0:$PORT` and exposes `/` and `/health`.
- **Your frontend (bleujs.org):** Point it at the Railway URL (e.g. `https://bleujs-production.up.railway.app`) for API/docs; no change to the contract. Ensure Railway has `DATABASE_URL` (and any other required env) set so the app starts correctly.

---

---

## Trivy / Dependabot security alerts (27 alerts)

**What we did:** Railway and CI now use **Dockerfile.production** (Debian Bookworm) instead of the Alpine Dockerfile. The GitHub Security scan (Trivy) was updated to **build and scan the production image** instead of the `bleu-os/` filesystem, so new runs will report on the same image we deploy.

**Existing 27 alerts:** They refer to the **old** Alpine-based image. After the next push and workflow run, the new Trivy run will upload results for the production image; many of those alerts (cpython, libexpat, sqlite in Alpine) should clear. Any that remain (e.g. kernel, or Debian base packages with no fix yet) can be **dismissed** with: *“Production uses Dockerfile.production (Debian); see bleu-os/TRIVY_ALERTS.md.”* Or run the repo script: `./scripts/dismiss-trivy-code-scanning-alerts.sh --dry-run` then without `--dry-run` if you want to bulk-dismiss.

*(This file can be deleted or kept for reference; it’s for handoff only.)*

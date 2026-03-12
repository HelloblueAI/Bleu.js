# Who serves the API – update for Bleu.js developers

## Who serves the API

**The Bleu.js project (SDK/CLI) only calls the API; it does not serve it.** The SDK and CLI send requests to the live API; they do not host or implement the chat/generate/embed endpoints.

The **live API is served by the bleujs.org app** (Next.js on Vercel). Traffic flow:

- **Client** (e.g. `bleu chat`, Python `BleuAPIClient`) → **api.bleujs.org** (Cloudflare Worker) → **bleujs.org** (Vercel).
- The handlers for `POST /api/v1/chat`, `POST /api/v1/generate`, and `POST /api/v1/embed` live in the **bleujs.org repo** (e.g. `app/api/v1/chat/route.ts`), not in the Bleu.js SDK/CLI repo or in Bleu.js-backend-export/FastAPI.

**Summary:** Bleu.js = API **client**. bleujs.org = API **server**.

## What was fixed on bleujs.org (API server)

Fixes were deployed on the bleujs.org side:

- **Chat** – 20 second timeout; if the backend does not respond in time we return 503 with a clear message instead of hanging 30–40 seconds.
- **Generate** – Errors from the AI layer now return 503 (and are logged) instead of 500. Response includes a top-level `"text"` field for clients that expect it.
- **Embed** – Same: 503 and logging instead of 500. If the primary embeddings provider fails (e.g. Anthropic), we fall back to an internal fallback provider so we can still return 200 with embeddings when possible.

## What the Bleu.js developer needs to do

**No server-side changes are required in the Bleu.js repo for these fixes.** The SDK/CLI only need to keep calling the same endpoints with the API key in `Authorization: Bearer` (from the bleujs.org dashboard).

If you were fixing or building Bleu.js-backend-export or a FastAPI app for chat/generate/embed: that is **not** what production uses today. Production is the bleujs.org Next.js app on Vercel. Either:

- Rely on the fixes deployed on bleujs.org and verify with `bleu chat`, `bleu generate`, `bleu embed` against the live API, or
- If we later decide to move traffic to another backend, we can document that separately.

## Short summary

- Bleu.js only **calls** the API; it does **not** serve it.
- The API is served by the **bleujs.org** Next.js app on Vercel.
- Chat timeout, generate/embed 500s, and response shapes were fixed on **bleujs.org**.
- No changes are required in the Bleu.js repo for these fixes; just keep using the live API with a dashboard API key.

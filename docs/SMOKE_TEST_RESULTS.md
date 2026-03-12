# Bleu.js smoke test results (live API)

Smoke tests run against **https://bleujs.org** with `BLEUJS_API_KEY` set. Use this doc to hand off to the backend team when endpoints fail.

**Last run:** v1.4.38 (API key via `BLEUJS_API_KEY`).

---

## PASS

| Check | Result |
|-------|--------|
| `bleu version` | v1.4.38 |
| `bleu health` | API healthy, Base URL https://bleujs.org |
| `bleu models list` | 10 models returned |
| Python `client.health()` | status: healthy |
| Python `client.list_models()` | 10 models |

---

## FAIL (backend)

| Check | Observed |
|-------|----------|
| `bleu chat "Hello, world!"` | No response; times out after 30s |
| Python `client.chat([{"role":"user","content":"Say hi."}])` | Hangs; no response in 45s |
| `bleu generate "..."` | API returns 500: `{"success":false,"error":"Internal Server Error","code":"INTERNAL_ERROR"}` |
| `bleu embed "Hello world" "Goodbye world"` | Same 500 Internal Server Error |
| Python `client.generate("Hi")` | APIError [500] `{'success': False, 'error': 'Internal Server Error', 'code': 'INTERNAL_ERROR'}` |
| Python `client.embed(["x","y"])` | Same 500 error |

---

## Summary for developer

- **Client/SDK** now surfaces API errors correctly (no more generic "Unknown error").
- **Remaining issues are server-side.** Fix in the backend (Bleujs.-backend) deployed at bleujs.org:
  - **`POST /api/v1/chat`** — timeout / no response; check server logs and that the route responds within 30s.
  - **`POST /api/v1/generate`** — returns 500 Internal Server Error; check server logs and handler.
  - **`POST /api/v1/embed`** — returns 500 Internal Server Error; check server logs and handler.
- Check server logs and backend for the API key used in the test; ensure the key is valid and not rate-limited or misconfigured.

**Backend repo:** [HelloblueAI/Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend). See [BACKEND_REPO.md](BACKEND_REPO.md) and [API_CLIENT_GUIDE.md](API_CLIENT_GUIDE.md) for contract alignment.

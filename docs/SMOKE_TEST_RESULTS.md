# Bleu.js smoke test results (live API)

Smoke tests run against **https://api.bleujs.org** with `BLEUJS_API_KEY` set. Use this doc to hand off to the backend team when endpoints fail.

**Last run:** v1.5.22 from a clean temporary virtualenv (API key via `BLEUJS_API_KEY`).

---

## PASS

| Check | Result |
|-------|--------|
| `pip install bleu-js` | Installed v1.5.22 |
| `import bleujs` | Import succeeded |
| `from bleujs.api_client import BleuAPIClient` | Import succeeded |
| `from bleujs import BleuJS` | Import succeeded |
| `bleu version` | Command exists and runs |
| `bleujs version` | Command exists and runs |

---

## FAIL (edge/API)

| Check | Observed |
|-------|----------|
| Python `BleuAPIClient.health()` | Cloudflare "Just a moment..." HTML challenge returned instead of JSON |
| Python `BleuAPIClient.list_models()` | Cloudflare "Just a moment..." HTML challenge returned instead of JSON |
| Python client default base URL in v1.5.22 | Defaults to `https://bleujs.org`; should default to `https://api.bleujs.org` |
| Python client with `base_url="https://api.bleujs.org"` | Still receives the Cloudflare browser challenge from `httpx` |

---

## Summary for developer

- **Packaging is healthy.** PyPI install, imports, and both CLI entry points work.
- **SDK default should use the API host.** Default `BleuAPIClient` and CLI base URL to `https://api.bleujs.org`.
- **Cloudflare/WAF is blocking live SDK usability.** Configure Cloudflare so `/health` and `/api/v1/*` bypass browser challenge / managed challenge for non-browser API clients such as the Python SDK's `httpx` client.
- **Add live smoke coverage.** Run a clean-venv PyPI smoke test with a real API key:

```bash
python -m venv /tmp/bleujs-smoke
. /tmp/bleujs-smoke/bin/activate
pip install bleu-js
python -c "from bleujs.api_client import BleuAPIClient; print(BleuAPIClient(api_key='...').list_models())"
```

**Backend repo:** [HelloblueAI/Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend). See [BACKEND_REPO.md](BACKEND_REPO.md) and [API_CLIENT_GUIDE.md](API_CLIENT_GUIDE.md) for contract alignment.

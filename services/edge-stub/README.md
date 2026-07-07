# Edge API stub

OpenAPI-shaped stub for `POST /api/v1/chat`, `/generate`, `/embed`, and related routes.

**Not production.** Live AI is served by [bleujs.org](https://github.com/HelloblueAI/bleujs.org) (Next.js + `ml_engine` on Railway). See [Who serves the API](../../docs/WHO_SERVES_THE_API.md).

## Local dev

```bash
cd services/edge-stub
node server.mjs
# http://127.0.0.1:4003
```

## Tests

```bash
npm test
```

Contract tests read `docs/api/openapi.yaml` in this repo (no network).

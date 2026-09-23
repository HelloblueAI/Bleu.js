# Edge API stub

OpenAPI-shaped stub for `POST /api/v1/chat`, `/generate`, `/embed`, and related routes.

**Not the hosted API.** This process is a local and CI stand-in for the OpenAPI contract. See [API client and contract](../../docs/WHO_SERVES_THE_API.md).

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

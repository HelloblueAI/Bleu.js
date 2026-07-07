# Changing the API (runbook)

When you add or change endpoints, request/response shapes, or the public API, follow this flow so **Bleu.js** (SDK, contract), **bleujs.org** (production), and the edge stub stay aligned.

## 1. Update the contract (Bleu.js repo)

- **Edit [docs/api/openapi.yaml](api/openapi.yaml)** — paths, requestBody, responses, components. CI validates this file and runs edge-stub tests.

- **Update the doc table** in [API Client Guide – API contract and response shapes](API_CLIENT_GUIDE.md#api-contract-and-response-shapes).

- **If the change is breaking:** Prefer `/api/v2/...` or new optional fields. Document in the main [CHANGELOG](../CHANGELOG.md).

## 2. Edge stub (Bleu.js — local / CI only)

- Update [`services/edge-stub/index.mjs`](../services/edge-stub/index.mjs) if the stub should reflect new routes.
- Run `npm test` in `services/edge-stub/`.

## 3. Production (bleujs.org)

- Implement routes in the **bleujs.org** Next.js app (and ML engine if `/predict` changes).
- Deploy via that repo’s normal Vercel / Railway flow.

## 4. SDK / CLI (Bleu.js repo)

- Update Python client, CLI, or playground to match the spec.
- Add tests; update [CHANGELOG](../CHANGELOG.md) if user-facing.

## Quick checklist

| Step | Repo | Action |
|------|------|--------|
| 1a | Bleu.js | Update `docs/api/openapi.yaml` |
| 1b | Bleu.js | Update contract table in API_CLIENT_GUIDE.md |
| 2 | Bleu.js | Update `services/edge-stub/`; `npm test` |
| 3 | bleujs.org | Implement production routes; deploy |
| 4 | Bleu.js | Update SDK/CLI; tests; CHANGELOG |

See [Repositories and sync](REPOSITORIES.md).

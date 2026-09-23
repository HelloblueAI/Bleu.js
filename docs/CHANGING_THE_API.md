# Changing the API

When you add or change public endpoints or request/response shapes, update the contract in this repository so the SDK, CLI, docs, and edge stub stay aligned.

## 1. Update the contract

- Edit [docs/api/openapi.yaml](api/openapi.yaml) — paths, request bodies, responses, and components. CI validates this file and runs the edge-stub tests.
- Update the table in [API Client Guide – API contract and response shapes](API_CLIENT_GUIDE.md#api-contract-and-response-shapes).
- For a breaking change, prefer `/api/v2/...` or new optional fields. Document the change in [CHANGELOG](../CHANGELOG.md).

## 2. Edge stub (local and CI)

- Update [`services/edge-stub/index.mjs`](../services/edge-stub/index.mjs) when the stub should reflect the new routes.
- Run `npm test` in `services/edge-stub/`.

The edge stub is for local development and contract tests. It is not a deployment of the hosted API.

## 3. SDK and CLI

- Update the Python client, CLI, or examples to match the spec.
- Add tests, and update [CHANGELOG](../CHANGELOG.md) when the change is user-facing.

## Checklist

| Step | Action |
|------|--------|
| 1a | Update `docs/api/openapi.yaml` |
| 1b | Update the contract table in API_CLIENT_GUIDE.md |
| 2 | Update `services/edge-stub/` and run `npm test` |
| 3 | Update the SDK or CLI, tests, and CHANGELOG |

The public base URL for the hosted API is `https://api.bleujs.org`. Self-hosted servers should implement the same OpenAPI contract if they want the SDK to work unchanged.

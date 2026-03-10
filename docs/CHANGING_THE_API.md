# Changing the API (runbook)

When you add or change endpoints, request/response shapes, or the public API in any way, follow this flow so both the **Bleu.js** repo (SDK, docs) and the **Bleujs.-backend** repo stay in sync and we ship faster.

## 1. Update the contract (Bleu.js repo)

- **Edit [docs/api/openapi.yaml](api/openapi.yaml)**
  Add or change paths, requestBody, responses, and components so the spec is the single source of truth. CI will validate this file.

- **Update the doc table**
  In [API Client Guide – API contract and response shapes](API_CLIENT_GUIDE.md#api-contract-and-response-shapes), keep the markdown table in line with the spec (for humans and search).

- **If the change is breaking**
  Prefer a new path (e.g. `/api/v2/...`) or a new optional field instead of changing existing behavior. If you must break, document it in the main [CHANGELOG](../CHANGELOG.md) and in the backend [CHANGELOG](https://github.com/HelloblueAI/Bleujs.-backend/blob/main/CHANGELOG.md).

## 2. Implement in backend (Bleujs.-backend repo)

- Implement or update routes and handlers to match the spec.
- Run `npm test` (typecheck + smoke + contract) and `npm run lint`.
- Add an entry to the backend [CHANGELOG](https://github.com/HelloblueAI/Bleujs.-backend/blob/main/CHANGELOG.md) describing the API change (for deployers and SDK maintainers).

## 3. Implement in SDK / CLI (Bleu.js repo)

- Update the Python client, CLI, or playground to use the new or changed API (same URLs, request/response shapes as in the spec).
- Add or update tests. Mention the change in the main [CHANGELOG](../CHANGELOG.md) if it affects users.

## 4. Compatibility

- **SDK and backend are versioned independently.** When you change the API, note in the backend CHANGELOG which backend version includes the change. Users should use an SDK version that matches the backend they deploy; we document this in [Repositories and sync](REPOSITORIES.md#keeping-client-and-backend-in-sync).

## Quick checklist

| Step | Repo | Action |
|------|------|--------|
| 1a | Bleu.js | Update `docs/api/openapi.yaml` |
| 1b | Bleu.js | Update API contract table in API_CLIENT_GUIDE.md |
| 2a | Bleujs.-backend | Implement/update routes; run `npm test` and lint |
| 2b | Bleujs.-backend | Add CHANGELOG entry for the API change |
| 3 | Bleu.js | Update SDK/CLI/playground; tests; CHANGELOG if user-facing |

This runbook keeps the two repos aligned and speeds up iteration: contract first, then backend, then client.

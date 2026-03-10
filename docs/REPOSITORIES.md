# Bleu.js project: repositories and sync

The **Bleu.js project** is split across two repositories so each stays focused, secure, and easy to maintain. This document is the single source of truth for how the pieces fit together and how we keep them in sync.

## Repositories

| Repository | Purpose | Primary audience |
|------------|---------|------------------|
| **[Bleu.js](https://github.com/HelloblueAI/Bleu.js)** | Python SDK, CLI, docs, demos, Bleu OS, product app (bleujs.org surface) | Users, SDK/CLI contributors, doc contributors |
| **[Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend)** | Node/Express API, ML inference, rules engine, services that power the cloud API | Backend contributors, DevOps |

The backend repo’s canonical name is **Bleujs.-backend** (with the dot); URL: `https://github.com/HelloblueAI/Bleujs.-backend`.

## How they work together

```
Users / SDK / CLI  →  bleujs.org (product)  →  Backend API (Bleujs.-backend)
                          ↑
                    This repo (Bleu.js): SDK, CLI, docs, dashboard
```

- **This repo (Bleu.js):** Users install `bleu-js`, use the CLI and SDK, and read the docs. The product app (e.g. bleujs.org) is also built from this repo.
- **Backend repo:** The API that the SDK and CLI call (chat, generate, embed, etc.) is implemented and deployed from the backend repo. Deployments point bleujs.org (or your API URL) at the backend’s main branch or releases.

## Keeping client and backend in sync

We keep behavior consistent across repos via a **documented API contract**:

- **Single source of truth:** [API contract and response shapes](API_CLIENT_GUIDE.md#api-contract-and-response-shapes) in this repo.
- **Endpoints:** e.g. `POST /api/v1/chat`, `POST /api/v1/generate`, `POST /api/v1/embed`.
- **Request/response shapes:** The table in the link above defines what clients send and what backends should return. When you change the API, update that doc and then align both the SDK (this repo) and the backend (Bleujs.-backend) to it.

The backend README links to this contract so backend contributors stay aligned. The **machine-readable** contract is [docs/api/openapi.yaml](api/openapi.yaml); when you change the API, update that spec and the doc table, then align both repos. Backend API changes are noted in the backend [CHANGELOG](https://github.com/HelloblueAI/Bleujs.-backend/blob/main/CHANGELOG.md). **Runbook:** [Changing the API](CHANGING_THE_API.md) — step-by-step so both repos stay in sync and we ship faster.

**Version compatibility:** The SDK (this repo) and the backend ([Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend)) are versioned independently. Use an SDK version that is compatible with the backend API you deploy; check the backend [CHANGELOG](https://github.com/HelloblueAI/Bleujs.-backend/blob/main/CHANGELOG.md) for API changes when upgrading either side. We aim to keep current SDK (e.g. 1.4.x) working with current backend (e.g. 1.1.x); when we introduce breaking API changes we document them in both CHANGELOGs and may bump a path (e.g. `/api/v2`).

## Where to contribute

| You want to… | Repo | Links |
|--------------|------|--------|
| Fix or extend the SDK, CLI, or docs | [Bleu.js](https://github.com/HelloblueAI/Bleu.js) | [CONTRIBUTING](../CONTRIBUTING.md), [Contributor guide](CONTRIBUTOR_GUIDE.md) |
| Fix or extend the API server, inference, or backend services | [Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend) | Backend [README](https://github.com/HelloblueAI/Bleujs.-backend#readme), [Bleu.js CONTRIBUTING](https://github.com/HelloblueAI/Bleu.js/blob/main/CONTRIBUTING.md) |
| Report a security issue | Either | [SECURITY.md](../SECURITY.md) (Bleu.js), [Backend SECURITY](https://github.com/HelloblueAI/Bleujs.-backend/blob/main/SECURITY.md) |
| Propose a change that touches both | Open an issue in both or start in the repo that owns the contract (usually Bleu.js for API shape) | — |

## Why two repos?

- **Clear scope:** One repo = one product surface (SDK, CLI, docs). Backend = API and services. Same pattern as many API-first and platform projects.
- **Security and dependency hygiene:** Fewer manifests in one place, so Dependabot and security alerts stay manageable. See [Dependabot and dependencies](DEPENDABOT_AND_DEPENDENCIES.md) and [Backend repo](BACKEND_REPO.md).
- **Contributor experience:** Contributors know where to open issues and PRs; backend and SDK can evolve at their own pace.

## Accelerating the flow

- **Change the API in one place:** Update [openapi.yaml](api/openapi.yaml) first; CI validates it. Then backend and SDK follow. See [Changing the API](CHANGING_THE_API.md).
- **Backend contributors:** After changing routes or responses, update the spec in the main repo (or open a PR there), add a backend CHANGELOG entry, and run `npm test`.
- **Single checklist:** The runbook above keeps contract → backend → client in order so we stay ahead of teams that don’t document the flow.

## More

- **Backend details (export, setup, deploy):** [BACKEND_REPO.md](BACKEND_REPO.md)
- **Backend release notes:** [Bleujs.-backend CHANGELOG](https://github.com/HelloblueAI/Bleujs.-backend/blob/main/CHANGELOG.md)
- **Product architecture (bleujs.org app):** [PRODUCT_ARCHITECTURE.md](PRODUCT_ARCHITECTURE.md)
- **Evaluating Bleu.js / award submission:** [Evaluation and awards](EVALUATION_AND_AWARDS.md)

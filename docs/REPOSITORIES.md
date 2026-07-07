# Repositories and sync

The **Bleu.js project** spans two active repositories plus the live product site.

## Repositories

| Repository | Purpose | Primary audience |
|------------|---------|------------------|
| **[Bleu.js](https://github.com/HelloblueAI/Bleu.js)** | Python SDK, CLI, docs, product app, edge API stub (`services/edge-stub`) | Users, SDK/CLI contributors, doc contributors |
| **[bleujs.org](https://github.com/HelloblueAI/bleujs.org)** | Production site, Next.js API routes, ML engine (`ml_engine/`) on Railway | Web, API, and ML contributors |

**Archived (2026-07):** [Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend) — stub and contract tests moved to `services/edge-stub/` in this repo. Production never depended on it.

## How they work together

```
Users / SDK / CLI  →  api.bleujs.org  →  bleujs.org (Next.js) — chat / generate / embed
                          ↑
                    This repo: SDK, CLI, docs, OpenAPI contract

ML inference       →  bleujs.org ml_engine (Railway) — POST /predict
Local / CI stub    →  this repo services/edge-stub — contract tests only
```

- **This repo (Bleu.js):** Install `bleu-js`, use the CLI/SDK, maintain [openapi.yaml](api/openapi.yaml), run edge-stub tests in CI.
- **bleujs.org:** Production AI and ML. See [Who serves the API](WHO_SERVES_THE_API.md).

## Keeping client and server in sync

- **Single source of truth:** [API contract](API_CLIENT_GUIDE.md#api-contract-and-response-shapes) and [openapi.yaml](api/openapi.yaml) in **this repo**.
- **Runbook:** [Changing the API](CHANGING_THE_API.md) — update spec → edge stub (if needed) → bleujs.org → SDK.

## Where to contribute

| You want to… | Repo | Links |
|--------------|------|--------|
| SDK, CLI, docs, OpenAPI, edge stub | [Bleu.js](https://github.com/HelloblueAI/Bleu.js) | [CONTRIBUTING](../CONTRIBUTING.md) |
| Production API, website, ML engine | [bleujs.org](https://github.com/HelloblueAI/bleujs.org) | That repo’s CONTRIBUTING |
| Report a security issue | Bleu.js or bleujs.org | [SECURITY.md](../SECURITY.md) |

## More

- **Archived backend repo:** [BACKEND_REPO.md](BACKEND_REPO.md)
- **Who serves the live API:** [WHO_SERVES_THE_API.md](WHO_SERVES_THE_API.md)
- **Deployment:** [DEPLOYMENT_PRACTICES.md](DEPLOYMENT_PRACTICES.md)
- **Product architecture:** [PRODUCT_ARCHITECTURE.md](PRODUCT_ARCHITECTURE.md)

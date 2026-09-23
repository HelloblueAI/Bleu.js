# This repository

[Bleu.js](https://github.com/HelloblueAI/Bleu.js) is the open-source SDK, CLI, docs, OpenAPI contract, and optional self-hosted app.

| You want to… | Where |
|--------------|--------|
| Install the SDK or CLI | PyPI package `bleu-js` |
| Call the hosted API | `https://api.bleujs.org` (set `BLEUJS_API_KEY`) |
| Change the public contract | [openapi.yaml](api/openapi.yaml) and [Changing the API](CHANGING_THE_API.md) |
| Run contract tests | [`services/edge-stub/`](../services/edge-stub/) |
| Run the app yourself | [Deployment practices](DEPLOYMENT_PRACTICES.md) and [`.env.example`](../.env.example) |
| Report a security issue | [SECURITY.md](../SECURITY.md) |

The hosted API base URL is part of the public client contract. This repository does not document how that service is deployed.

## Keeping clients and the contract aligned

[openapi.yaml](api/openapi.yaml) in this repo is the source of truth for request and response shapes. Follow [Changing the API](CHANGING_THE_API.md) when those shapes change.

See also [Product architecture](PRODUCT_ARCHITECTURE.md) and [CONTRIBUTING](../CONTRIBUTING.md).

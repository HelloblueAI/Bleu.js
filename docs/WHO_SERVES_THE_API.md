# API, assistants, and local utilities

This repository contains the Python SDK, CLI, optional local utilities, and the
API contract. It does **not** define pricing, hosted deployment, or website
assistant entitlements. Current public product docs live on
[bleujs.org](https://bleujs.org).

## Hosted Developer API

The SDK and CLI call the public Developer API for chat, generate, embed, model
listing, and health checks.

- Default base URL: `https://api.bleujs.org`
- Auth header: `Authorization: Bearer <BLEUJS_API_KEY>`
- Python client: pass `api_key=...` or set `BLEUJS_API_KEY`
- CLI: set `BLEUJS_API_KEY` or run `bleu config set api-key <key>`
- Override with `BLEUJS_BASE_URL` only when you run a server that implements the
  same contract
- Contract: [docs/api/openapi.yaml](api/openapi.yaml)

`bleu chat`, `bleu generate`, `bleu embed`, `bleu models list`, and
`BleuAPIClient` methods require a hosted API key unless you point them at a
compatible self-hosted API.

## Website assistants

Public bleujs.org product pages describe no-code website assistants separately
from the Developer API. They are configured in the Bleu.js dashboard and embedded
with a widget or share link; website visitors do not use a developer API key in
the embed. Keep assistant limits, reply allowances, trials, and billing language
on bleujs.org instead of duplicating those terms in this repository.

## Local and test-only utilities

These are valid local/offline surfaces, but they are not the hosted API:

- `BleuJS().process(...)` in `src/bleujs/core.py` processes local Python data
  without a hosted API key.
- Optional `[ml]` and `[quantum]` extras run local model or quantum examples
  unless their own provider token is documented (for example IBM Quantum).
- [`services/edge-stub/`](../services/edge-stub/) is for local development and
  CI contract tests. It is not the hosted API.
- Self-hosting the FastAPI app is documented separately in
  [INSTALLATION.md](INSTALLATION.md) and requires your own environment, secrets,
  and database.

To change paths or response shapes, follow [Changing the API](CHANGING_THE_API.md).

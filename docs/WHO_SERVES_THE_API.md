# API client and contract

The SDK and CLI in this repository **call** the public API. They send `Authorization: Bearer` with `BLEUJS_API_KEY`.

- Default base URL: `https://api.bleujs.org`
- Override with `BLEUJS_BASE_URL` when you run a server that implements the same contract
- Contract: [docs/api/openapi.yaml](api/openapi.yaml)
- Local stand-in for tests: [`services/edge-stub/`](../services/edge-stub/)

`services/edge-stub/` is for local development and CI. It is not the hosted API.

To change paths or response shapes, follow [Changing the API](CHANGING_THE_API.md).

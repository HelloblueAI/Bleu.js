# API spec (Bleu.js)

This folder holds the **machine-readable API contract** for the Bleu.js API.

- **Spec:** [openapi.yaml](openapi.yaml) — OpenAPI 3.0. Single source of truth; validated in CI when it changes.
- **Human-readable contract:** [API Client Guide – API contract and response shapes](../API_CLIENT_GUIDE.md#api-contract-and-response-shapes).
- **Changing the API:** [Changing the API runbook](../CHANGING_THE_API.md) — update the spec here first, then backend and SDK.

The edge stub ([`services/edge-stub/`](../../services/edge-stub/)), [bleujs.org](https://github.com/HelloblueAI/bleujs.org), and the SDK in this repo stay in sync with this spec.

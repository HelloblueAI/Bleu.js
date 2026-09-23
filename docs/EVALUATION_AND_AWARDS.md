# Evaluating Bleu.js / Award submission

This page gives evaluators, judges, and award committees a single entry point to understand how the project is run and why it stands out as open source.

## Project at a glance

- **What it is:** Bleu.js is a quantum-enhanced AI platform: cloud API, CLI, and Python SDK ([bleujs.org](https://bleujs.org)).
- **Public contract:** The SDK, CLI, and [OpenAPI spec](api/openapi.yaml) live in this repository. Clients call `https://api.bleujs.org`.
- **Standards:** We follow a [security policy](../SECURITY.md) and a single source of truth for [dependencies and Dependabot](DEPENDABOT_AND_DEPENDENCIES.md).

## Where to look

| If you want to see… | Link |
|----------------------|------|
| **What this repository contains** | [This repository](REPOSITORIES.md) |
| **Security (reporting, no secrets, deployment)** | [SECURITY.md](../SECURITY.md) |
| **How to contribute** | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| **API contract (client ↔ backend)** | [API contract and response shapes](API_CLIENT_GUIDE.md#api-contract-and-response-shapes) · [OpenAPI spec](api/openapi.yaml) |
| **Changing the API** | [Changing the API](CHANGING_THE_API.md) |
| **Community standards** | [Code of Conduct](../CODE_OF_CONDUCT.md) |
| **Roadmap and status** | [ROADMAP.md](ROADMAP.md) |
| **Product and bleujs.org app** | [Product architecture](PRODUCT_ARCHITECTURE.md) |
| **Changelog** | [CHANGELOG.md](../CHANGELOG.md) |

## Why this project stands out

- **Clarity:** [REPOSITORIES.md](REPOSITORIES.md) says what this repository contains. The public API contract is [openapi.yaml](api/openapi.yaml).
- **Contract-first:** The spec is validated in CI. SDK and CLI changes follow [Changing the API](CHANGING_THE_API.md).
- **Security and hygiene:** No secrets in the repo. [SECURITY.md](../SECURITY.md) covers reporting. Dependabot scope is documented in [DEPENDABOT_AND_DEPENDENCIES.md](DEPENDABOT_AND_DEPENDENCIES.md).
- **Contributor experience:** [CONTRIBUTING.md](../CONTRIBUTING.md) and the [Code of Conduct](../CODE_OF_CONDUCT.md) are in this repository.
- **Award-ready structure:** Standards, repos, security, runbook, and evaluation path are documented and linked so committees can assess the project quickly and fairly.

Thank you for evaluating Bleu.js. We welcome questions and feedback.

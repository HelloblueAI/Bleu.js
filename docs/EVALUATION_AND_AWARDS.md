# Evaluating Bleu.js / Award submission

This page gives evaluators, judges, and award committees a single entry point to understand how the project is run and why it stands out as open source.

## Project at a glance

- **What it is:** Bleu.js is a quantum-enhanced AI platform: cloud API, CLI, and Python SDK ([bleujs.org](https://bleujs.org)).
- **Two-repo design:** The project is split into **[Bleu.js](https://github.com/HelloblueAI/Bleu.js)** (SDK, CLI, docs, product app) and **[Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend)** (API and services). We keep them in sync via a single [API contract](API_CLIENT_GUIDE.md#api-contract-and-response-shapes) and a clear [repositories overview](REPOSITORIES.md).
- **Standards:** We follow documented [open source standards](OPEN_SOURCE_STANDARDS.md), a strict [security policy](../SECURITY.md), and a single source of truth for [dependencies and Dependabot](DEPENDABOT_AND_DEPENDENCIES.md).

## Where to look

| If you want to see… | Link |
|----------------------|------|
| **How the two repos fit together** | [Repositories and sync](REPOSITORIES.md) |
| **Open source practices we follow** | [Open source standards](OPEN_SOURCE_STANDARDS.md) |
| **Security (reporting, no secrets, deployment)** | [SECURITY.md](../SECURITY.md) |
| **How to contribute (both repos)** | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| **API contract (client ↔ backend)** | [API contract and response shapes](API_CLIENT_GUIDE.md#api-contract-and-response-shapes) |
| **Community standards** | [Code of Conduct](../CODE_OF_CONDUCT.md) |
| **Roadmap and status** | [ROADMAP.md](ROADMAP.md) |
| **Product and bleujs.org app** | [Product architecture](PRODUCT_ARCHITECTURE.md) |
| **Main project changelog** | [CHANGELOG.md](../CHANGELOG.md) |
| **Backend (API server) repo** | [Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend) (with its own [CHANGELOG](https://github.com/HelloblueAI/Bleujs.-backend/blob/main/CHANGELOG.md)) |

## Why this project stands out

- **Clarity:** One document ([REPOSITORIES.md](REPOSITORIES.md)) explains the two-repo setup and how we keep client and backend aligned. No hidden coupling.
- **Contract-first:** The API contract lives in one place; both the SDK and the backend point to it. Changes are visible and traceable.
- **Security and hygiene:** No secrets in the repo; separate backend repo keeps dependency surface and Dependabot scope manageable; [SECURITY.md](../SECURITY.md) covers reporting and deployment.
- **Contributor experience:** CONTRIBUTING and Code of Conduct are consistent across repos; the backend defers to the main project’s community standards.
- **Award-ready structure:** Standards, repos, security, and evaluation path are documented and linked so committees can assess the project quickly and fairly.

Thank you for evaluating Bleu.js. We welcome questions and feedback.

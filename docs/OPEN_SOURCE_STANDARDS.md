# Open source standards we follow

**For maintainer/internal reference only.** This doc is not linked from public-facing pages (README, evaluation, contributing). Use it internally to align on how we run the repo.

Bleu.js is run like a modern, maintainable open-source project. Here’s what we do so the repo stays clear, secure, and easy to contribute to.

| Practice                    | What we do                                                                                                                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Two-repo architecture**  | This repo = SDK, CLI, docs; [backend repo](https://github.com/HelloblueAI/Bleujs.-backend) = API and services. Single source of truth: [Repositories and sync](REPOSITORIES.md).   |
| **Single product surface**  | This repo = Python SDK, CLI, docs, demos. Backend lives in a [separate repo](BACKEND_REPO.md). Same pattern as Node.js and API-first companies.                                     |
| **Security first**          | No secrets in the repo. [SECURITY.md](../SECURITY.md) covers reporting, API keys, and deployment checklist.                                                                         |
| **Controlled dependencies** | One pip surface (root), one npm app (collaboration-tools). [Dependabot doc](DEPENDABOT_AND_DEPENDENCIES.md) explains scope so we avoid alert overload.                              |
| **Documented API contract** | [API contract and response shapes](API_CLIENT_GUIDE.md#api-contract-and-response-shapes) — linked from README and CONTRIBUTING so clients and backends stay in sync.                   |
| **Clear status**            | Beta, with [Changelog](../CHANGELOG.md) and [Roadmap](ROADMAP.md). “Who it’s for” and production path in README.                                                                    |
| **Community**               | [Code of Conduct](../CODE_OF_CONDUCT.md), [Contributing](../CONTRIBUTING.md), [Support](../SUPPORT.md), [Contributor](CONTRIBUTOR_GUIDE.md) and [Onboarding](ONBOARDING.md) guides. |

If you’re evaluating the project or contributing, this is the standard we hold ourselves to. **Evaluators and award committees:** see [Evaluation and awards](EVALUATION_AND_AWARDS.md) for a single entry point to all of the above.

---

## Same approach as other .js and OSS projects

We grow Bleu.js using the same patterns as established projects like **Node.js**, **Fuse.js**, **Express**, and other API-first or platform projects:

| Practice | What others do | What we do |
|----------|----------------|------------|
| **Multiple repos** | Node.js: core (nodejs/node) + website, docs, i18n. Express, Stripe: API/sdk split. | [Bleu.js](https://github.com/HelloblueAI/Bleu.js) (SDK, CLI, docs) + [Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend) (API). [REPOSITORIES.md](REPOSITORIES.md). |
| **Contract / API spec** | Many use OpenAPI, TypeScript defs, or a spec repo so clients and servers stay in sync. | [OpenAPI spec](api/openapi.yaml) + [API contract doc](API_CLIENT_GUIDE.md#api-contract-and-response-shapes). Single source of truth in this repo. |
| **Community and governance** | CODE_OF_CONDUCT, CONTRIBUTING, SECURITY, clear "where to contribute." | Same: [CODE_OF_CONDUCT](../CODE_OF_CONDUCT.md), [CONTRIBUTING](../CONTRIBUTING.md), [SECURITY](../SECURITY.md), [REPOSITORIES](REPOSITORIES.md) for which repo does what. |
| **Versioning and releases** | Semver, CHANGELOG, clear compatibility (e.g. Node LTS, API versions). | Semver; [CHANGELOG](../CHANGELOG.md) (main), backend [CHANGELOG](https://github.com/HelloblueAI/Bleujs.-backend/blob/main/CHANGELOG.md); [version compatibility](REPOSITORIES.md#keeping-client-and-backend-in-sync) (SDK vs backend). |
| **Quality and security** | CI (lint, test), Dependabot, no secrets in repo, SECURITY.md. | CI in both repos; [Dependabot scope](DEPENDABOT_AND_DEPENDENCIES.md); no secrets; [SECURITY](../SECURITY.md). |
| **Docs and onboarding** | README, getting started, API reference, roadmap. | [README](../README.md), [GET_STARTED](GET_STARTED.md), [API Client Guide](API_CLIENT_GUIDE.md), [ROADMAP](ROADMAP.md). |

We don't claim to match the scale of Node.js or a foundation-backed project; we do follow the same **multi-repo, contract-first, community-first** approach so the project can grow in a maintainable way.

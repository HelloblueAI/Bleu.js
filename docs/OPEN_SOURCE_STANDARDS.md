# Open source standards we follow

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

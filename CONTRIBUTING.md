# Contributing to Bleu.js

**New?** Start with the [Contributor guide](docs/CONTRIBUTOR_GUIDE.md) or a [good first issue](https://github.com/HelloblueAI/Bleu.js/issues?q=is%3Aopen+label%3A%22good+first+issue%22).

We welcome contributions. The full guide is in the docs:

**[→ Contributing guide (setup, PR process, coding standards)](docs/CONTRIBUTING.md)**

**Backend:** The Node/Express API lives in a [separate repo](docs/BACKEND_REPO.md). For backend-only changes, open issues and PRs in [HelloblueAI/Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend). See [Repositories and sync](docs/REPOSITORIES.md) for how both repos fit together.

Quick links:

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Repositories and sync](docs/REPOSITORIES.md) (where to contribute: SDK vs backend)
- [Security policy](SECURITY.md)
- [API contract and response shapes](docs/API_CLIENT_GUIDE.md#api-contract-and-response-shapes)
- [Changing the API](docs/CHANGING_THE_API.md) — when your change affects the API, follow this runbook so both repos stay in sync.
- [Bug report](.github/ISSUE_TEMPLATE/bug_report.md) · [Feature request](.github/ISSUE_TEMPLATE/feature_request.md)

**Internal docs:** Maintainer-only docs (release instructions, org checklist) are in `docs/internal/` and are not in the public repo; see [docs/internal/README.md](docs/internal/README.md).

**Version:** The package version is defined in `src/bleujs/__init__.py` only. Other subpackages may use their own version strings; the canonical version for releases and the API is `bleujs.__version__`. See [Release checklist](docs/RELEASE_CHECKLIST.md).

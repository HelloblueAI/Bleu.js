# Contributing to Bleu.js

**New?** Start with the [Contributor guide](docs/CONTRIBUTOR_GUIDE.md) or a [good first issue](https://github.com/HelloblueAI/Bleu.js/issues?q=is%3Aopen+label%3A%22good+first+issue%22).

We welcome contributions. The full guide is in the docs:

**[→ Contributing guide (setup, PR process, coding standards)](docs/CONTRIBUTING.md)**

**Edge API stub:** Local/CI OpenAPI stub lives in [`services/edge-stub/`](services/edge-stub/). Production API is [bleujs.org](https://github.com/HelloblueAI/bleujs.org). See [Repositories and sync](docs/REPOSITORIES.md).

**Develop from source:** clone → `python -m venv .venv` → `pip install -e .` → set `BLEUJS_API_KEY` in `.env` → `bleu chat "Hello"`. Details: [Development setup](docs/CONTRIBUTING.md#-development-setup).

Quick links:

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [IP and contributions](docs/IP_AND_CONTRIBUTIONS.md)
- [Package map](docs/PACKAGE_MAP.md) — canonical `bleu-js` vs other repo trees
- [Maintainers](MAINTAINERS.md) — official team (not GitHub’s auto contributor graph)
- [Repositories and sync](docs/REPOSITORIES.md) (where to contribute: SDK vs backend)
- [Security policy](SECURITY.md)
- [API contract and response shapes](docs/API_CLIENT_GUIDE.md#api-contract-and-response-shapes)
- [Changing the API](docs/CHANGING_THE_API.md) — when your change affects the API, follow this runbook (spec → edge stub → bleujs.org → SDK).
- [Bug report](.github/ISSUE_TEMPLATE/bug_report.md) · [Feature request](.github/ISSUE_TEMPLATE/feature_request.md)

**Internal docs:** Maintainer-only docs (release instructions, org checklist) are in `docs/internal/` and are not in the public repo; see [docs/internal/README.md](docs/internal/README.md).

**Version:** Keep `pyproject.toml` and `src/bleujs/__init__.py` in sync for releases. Other subpackages may use their own version strings; the runtime version exposed to users is `bleujs.__version__`. See [Release checklist](docs/RELEASE_CHECKLIST.md).

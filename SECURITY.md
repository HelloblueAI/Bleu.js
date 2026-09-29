# Security

## Reporting a vulnerability

If you find a security issue, report it privately:

- **Preferred:** Open a private security advisory on GitHub: [Security Advisories](https://github.com/HelloblueAI/Bleu.js/security/advisories/new).
- Or email [security@helloblue.ai](mailto:security@helloblue.ai).

Do not open a public issue for an unfixed vulnerability. We will acknowledge the report and coordinate disclosure.

## Secrets

Do not commit passwords, API keys, tokens, or private keys.

- API keys (`BLEUJS_API_KEY`, `bleujs_sk_...`) authenticate calls to the Bleu.js API. Pass them with environment variables or `bleu config set api-key`. They are not stored in this repository.
- The app reads secrets from the environment. [`.env.example`](.env.example) contains placeholders only. `.env`, key files, and similar paths are gitignored.
- Placeholder defaults in code are for local development. A deployment must set `SECRET_KEY`, `JWT_SECRET_KEY`, database credentials, and API keys itself.

## Scope

This repository is the open-source SDK, CLI, API contract, and optional self-hosted app. The public hosted API is `https://api.bleujs.org`. This file does not describe how that service is deployed.

If you run the optional self-hosted app, set its secrets through the environment, use HTTPS, and restrict CORS to the origins you intend to allow.

## Maintainers

Dependency scanning, Dependabot cleanup, and release security checks are maintainer work. The runbook is [Security tab hygiene](docs/SECURITY_TAB_HYGIENE.md).

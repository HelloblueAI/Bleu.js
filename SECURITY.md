# Security

## API keys and data

API keys (e.g. `BLEUJS_API_KEY`, `bleujs_sk_...`) are used only for authentication against the Bleu.js API. Do not commit them; use environment variables or a secrets manager. The service does not store your API key in plain text in the repo. For production, set all secrets via env and follow the deployment checklist below.

## Safe for open-source publication

- **No secrets in the repo:** Passwords, API keys, and tokens are not committed. The app reads them from environment variables (see `.env.example` for placeholders).
- **Sensitive paths ignored:** `.env`, `src/config/settings.py`, `.aws/`, `*.key`, `*.pem`, and similar files are in `.gitignore` and are not tracked.
- **Defaults are placeholders:** In code, defaults like `"your-secret-key"` are for local/dev only. In production you must set `JWT_SECRET_KEY`, `SECRET_KEY`, and other secrets via env or a secrets manager.

## Reporting a vulnerability

If you find a security issue, please report it responsibly:

- **Preferred:** Open a private security advisory on GitHub: [Security Advisories](https://github.com/HelloblueAI/Bleu.js/security/advisories/new).
- Or email the maintainers (see repository description / README) instead of opening a public issue.

We will acknowledge and work on the report and coordinate disclosure.

## Dependency alerts and Dependabot

We keep the repo's dependency surface small so Dependabot and security alerts stay manageable. The `backend/` directory is not in the repo (see [docs/DEPENDABOT_AND_DEPENDENCIES.md](docs/DEPENDABOT_AND_DEPENDENCIES.md)). Do not re-add backend or new app manifests without reading that doc.

## Deployment checklist

When deploying Bleu.js:

1. Set all secrets via environment variables or a secrets manager (e.g. AWS Secrets Manager). Do not rely on default values for `JWT_SECRET_KEY`, `SECRET_KEY`, DB passwords, or API keys.
2. Use HTTPS and restrict CORS as needed.
3. Keep dependencies updated (e.g. Dependabot, `pip install -U`, security scans).

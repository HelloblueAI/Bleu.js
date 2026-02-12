# Security

## Safe for open-source publication

- **No secrets in the repo:** Passwords, API keys, and tokens are not committed. The app reads them from environment variables (see `.env.example` for placeholders).
- **Sensitive paths ignored:** `.env`, `src/config/settings.py`, `.aws/`, `*.key`, `*.pem`, and similar files are in `.gitignore` and are not tracked.
- **Defaults are placeholders:** In code, defaults like `"your-secret-key"` are for local/dev only. In production you must set `JWT_SECRET_KEY`, `SECRET_KEY`, and other secrets via env or a secrets manager.

## Reporting a vulnerability

If you find a security issue, please report it responsibly:

- **Preferred:** Open a private security advisory on GitHub: [Security Advisories](https://github.com/HelloblueAI/Bleu.js/security/advisories/new).
- Or email the maintainers (see repository description / README) instead of opening a public issue.

We will acknowledge and work on the report and coordinate disclosure.

## Deployment checklist

When deploying Bleu.js:

1. Set all secrets via environment variables or a secrets manager (e.g. AWS Secrets Manager). Do not rely on default values for `JWT_SECRET_KEY`, `SECRET_KEY`, DB passwords, or API keys.
2. Use HTTPS and restrict CORS as needed.
3. Keep dependencies updated (e.g. Dependabot, `pip install -U`, security scans).

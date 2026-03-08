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

## Check security locally

Run dependency and (optional) image checks from the repo root:

```bash
./scripts/check-security.sh
```

This runs **pip-audit** (Python), **safety** (Python, if installed), and optionally **Trivy** on the Bleu OS image if Trivy is installed. For Dependabot and code-scanning alerts, use **GitHub → Security → Dependabot / Code scanning**.

**Easiest (no Poetry, works in Fish and Bash):** install [pipx](https://pypa.github.io/pipx/) then:

```bash
sudo apt install pipx    # or: pip install pipx
pipx ensurepath         # add to PATH (log out/in or restart terminal if needed)
pipx install pip-audit safety
./scripts/check-security.sh
```

The script will also try `pipx run pip-audit` / `pipx run safety` if the tools are not in PATH but pipx is installed.

**Alternative (venv):** On Debian/Ubuntu/Pop, ensure venv support and use Bash for activation:

```bash
sudo apt install python3-venv
python3 -m venv .venv
source .venv/bin/activate   # Bash/zsh (Fish: source .venv/bin/activate.fish)
pip install pip-audit safety
./scripts/check-security.sh
```

**Safety CLI quickstart (for future reference):** Safety may prompt you to log in. One-time setup:

1. **Install Safety CLI 3**
   ```bash
   pip install -U safety
   ```

2. **Authenticate** (once per machine)
   ```bash
   safety auth login
   ```

3. **Scan** from the repo root — either run Safety directly or the full security script:
   ```bash
   safety scan
   # or run all checks (pip-audit + safety + optional Trivy):
   ./scripts/check-security.sh
   ```

For CI / non-interactive use, set `SAFETY_API_KEY` (see [Safety docs](https://docs.safetycli.com/)).

## Deployment checklist

When deploying Bleu.js:

1. Set all secrets via environment variables or a secrets manager (e.g. AWS Secrets Manager). Do not rely on default values for `JWT_SECRET_KEY`, `SECRET_KEY`, DB passwords, or API keys.
2. Use HTTPS and restrict CORS as needed.
3. Keep dependencies updated (e.g. Dependabot, `pip install -U`, security scans).

## Recent security hardening

The codebase has been hardened with:

- **Auth:** JWT `sub` claim uses user id (UUID); UserService and middleware aligned; no weak or empty secret in production.
- **Secrets:** Production/staging reject default or weak `SECRET_KEY`/`JWT_SECRET_KEY`; Python backend requires a non-empty secret when not in dev.
- **CSRF:** Optional double-submit cookie protection (`ENABLE_CSRF_PROTECTION`); `GET /api/v1/csrf-token` and `X-CSRF-Token` header for state-changing requests when enabled.
- **Sensitive data:** Database URL is no longer logged (no credential fragments); default DB password is not allowed in production.
- **CORS & CSP:** Python backend no longer uses `allow_origins=["*"]` with credentials; CSP tightened (no `unsafe-inline`/`unsafe-eval` for scripts where possible).
- **XSS:** Dashboard and subscription templates escape API-sourced data when using `innerHTML`.
- **Errors:** 422 validation responses return a generic message instead of raw validation details.
- **JWT stack:** Python backend auth uses PyJWT instead of python-jose.

See [CHANGELOG.md](CHANGELOG.md) for release-specific notes.

# Security tab hygiene

How maintainers keep the GitHub **Security** tab accurate for [HelloblueAI/Bleu.js](https://github.com/HelloblueAI/Bleu.js).

---

## What shows up where

| Tab | Source | Typical alerts |
|-----|--------|----------------|
| **Dependabot** | `pyproject.toml`, `.github/`, Docker, npm in `collaboration-tools/` | Outdated or vulnerable dependencies |
| **Code scanning** | Trivy SARIF uploads from CI | Container / filesystem CVEs |
| **Secret scanning** | GitHub | Leaked tokens (should be 0) |

Legacy alerts from the removed `backend/` tree can linger for years unless dismissed. They do **not** reflect the current install surface (`pip install bleu-js`).

---

## Target counts (2026-06)

| Source | Target open alerts | Notes |
|--------|-------------------|--------|
| Dependabot | **< 50** | Currently **~30** after legacy cleanup |
| Code scanning (Trivy) | Fix or dismiss with reason | Unfixable base-image CVEs: document + dismiss |
| High/critical in default `pip install bleu-js` | **0** unmitigated | Verify with `./scripts/check-security.sh` |

---

## When to dismiss vs fix

| Situation | Action |
|-----------|--------|
| Manifest path contains `backend/` or file no longer in repo | **Dismiss** — reason: *No longer used* |
| Alert for optional extra (`ray`, `tensorflow`, etc.) user did not install | **Dismiss** or note it in this runbook |
| Fix available in `pyproject.toml` | **Fix** — bump pin, run tests, merge |
| Kernel / host CVE in Trivy on `bookworm-slim` with no image patch | **Dismiss** with comment; patch host or wait for base image |
| Transitive with no upstream fix (e.g. ray) | **Document** in the snapshot below; track upstream |

---

## Maintainer runbook

### 1. Local check (every release)

```bash
./scripts/check-security.sh
```

Fix any reported Python vulnerabilities in `pyproject.toml` before tagging.

### 2. Dependabot legacy cleanup (one-time or after scope change)

```bash
# Preview backend-related legacy alerts
./scripts/dismiss-backend-dependabot-alerts.sh --dry-run

# Dismiss alerts whose manifest path contains "backend"
./scripts/dismiss-backend-dependabot-alerts.sh

# Preview all open alerts (use with care)
./scripts/dismiss-backend-dependabot-alerts.sh --dismiss-all --dry-run
```

Requires `gh` CLI authenticated with `security_events` or repo admin scope. Full options: [DEPENDABOT_AND_DEPENDENCIES.md](DEPENDABOT_AND_DEPENDENCIES.md#fix-the-security-tab-bulk-dismiss).

### 3. Trivy code-scanning cleanup

```bash
./scripts/dismiss-trivy-code-scanning-alerts.sh --dry-run
./scripts/dismiss-trivy-code-scanning-alerts.sh
```

### 4. After cleanup

1. Note open Dependabot count in [OSS_SCORECARD.md](../OSS_SCORECARD.md).
2. Update the snapshot below if a named transitive issue is fixed or the alert target changes.
3. Do **not** re-add `backend/` or extra manifests without reading [DEPENDABOT_AND_DEPENDENCIES.md](DEPENDABOT_AND_DEPENDENCIES.md).

---

## Contributor note

You do **not** need to clear the Security tab to contribute. Outside reports belong in [SECURITY.md](../SECURITY.md). Maintainers handle bulk dismissals.

## Operational snapshot

These notes change as dependencies and alert counts change. They are not part of the public security policy.

| Source | What we track | Where to look |
|--------|----------------|---------------|
| Python (app) | CVEs in `pyproject.toml` deps | `./scripts/check-security.sh`; CI runs pip-audit and Safety |
| Dependabot | GitHub Security tab (pip, npm, Docker, Actions) | Target: under 50 open alerts. Legacy `backend/` alerts: `./scripts/dismiss-backend-dependabot-alerts.sh` |
| Docker | Base image and system packages | Root [Dockerfile](../Dockerfile) (Debian bookworm-slim). Kernel CVEs are the host |
| Trivy / code scanning | Container image vulns (SARIF) | `./scripts/dismiss-trivy-code-scanning-alerts.sh` for legacy alerts |
| Known transitive | protobuf 5.x (CVE-2026-0994), ray 2.x (no fix yet) | Protobuf: upgrade when TensorFlow/grpcio support protobuf 6+. Ray is an optional extra |

Local scan (maintainers):

```bash
./scripts/check-security.sh
```

That runs pip-audit, Safety when installed, and Trivy when a local image and the Trivy binary are present. `pipx install pip-audit safety` is enough if those tools are not already on `PATH`. Safety’s hosted database may ask for `safety auth login` or `SAFETY_API_KEY`.

Before a release, run that script, then the steps in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).

### Hardening already in the self-hosted app

Recorded so it is not lost from the public policy. Re-check the code before treating any line as current:

- API tokens stored as a SHA-256 hash; raw token returned once; list views use `token_prefix`
- Passwords hashed with bcrypt via passlib
- JWT verification uses an explicit algorithm list
- Production and staging reject default or weak `SECRET_KEY` and `JWT_SECRET_KEY`
- Optional CSRF double-submit cookie (`ENABLE_CSRF_PROTECTION`)
- Security headers include HSTS, `X-Frame-Options`, CSP, `X-Content-Type-Options`, Referrer-Policy, and Permissions-Policy
- Database URL is not logged; CORS is not `allow_origins=["*"]` with credentials
- Auth uses PyJWT

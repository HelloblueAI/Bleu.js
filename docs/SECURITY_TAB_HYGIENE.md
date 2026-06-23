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
| Alert for optional extra (`ray`, `tensorflow`, etc.) user did not install | **Dismiss** or document in [SECURITY.md](../SECURITY.md) |
| Fix available in `pyproject.toml` | **Fix** — bump pin, run tests, merge |
| Kernel / host CVE in Trivy on `bookworm-slim` with no image patch | **Dismiss** with comment; patch host or wait for base image |
| Transitive with no upstream fix (e.g. ray) | **Document** in SECURITY.md; track upstream |

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
2. Update the “Known vulnerabilities” table in [SECURITY.md](../SECURITY.md) if targets change.
3. Do **not** re-add `backend/` or extra manifests without reading [DEPENDABOT_AND_DEPENDENCIES.md](DEPENDABOT_AND_DEPENDENCIES.md).

---

## Contributor note

You do **not** need to clear the Security tab to contribute. Focus on `./scripts/check-security.sh` passing for Python changes. Maintainers handle bulk dismissals.

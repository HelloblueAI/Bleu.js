# Release checklist

Use this before cutting a new version or deploying to production.

## Pre-release

- [ ] **Version** — Bump in single source: `src/bleujs/__init__.py` (e.g. `__version__`). Config reads from `src.version.get_version()`.
- [ ] **Changelog** — Update [CHANGELOG.md](../CHANGELOG.md) with new version, date, and changes.
- [ ] **Security** — Run `./scripts/check-security.sh`. Resolve or document any HIGH/CRITICAL (see [SECURITY.md](../SECURITY.md)).
- [ ] **Tests** — `pipx run poetry run pytest` (or `poetry run pytest` with `--extras all`). All tests must pass.
- [ ] **Lint** — Run project linter/formatter (e.g. ruff, black) and fix issues.
- [ ] **Secrets** — No dev defaults in production; all secrets from env or secrets manager (see [SECURITY.md](../SECURITY.md) deployment checklist).

## Tag and publish

- [ ] **Tag** — `git tag -a vX.Y.Z -m "Release vX.Y.Z"` and push: `git push origin vX.Y.Z`.
- [ ] **Package** — If publishing to PyPI: build and upload per project docs (e.g. `poetry build` / `twine upload`).
- [ ] **Containers** — Rebuild any Docker images; run Trivy/Scout and address critical image vulns (see [SECURITY.md](../SECURITY.md)).

## After release

- [ ] **Announce** — Update README badge or release note if needed; notify stakeholders.
- [ ] **Dependabot** — Triage new alerts in [Security → Dependabot](https://github.com/HelloblueAI/Bleu.js/security/dependabot); bulk-dismiss only per [DEPENDABOT_AND_DEPENDENCIES.md](DEPENDABOT_AND_DEPENDENCIES.md).

---

**Quick ref:** [SECURITY.md](../SECURITY.md) (deployment + known vulns) · [CONTRIBUTING.md](../CONTRIBUTING.md) (development setup)

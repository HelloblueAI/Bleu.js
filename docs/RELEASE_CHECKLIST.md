# Release checklist

Use this before cutting a new version or deploying to production.

## Pre-release

- [ ] **Version** — Bump in `pyproject.toml` (`version = "X.Y.Z"`). This is the single source for the package.
- [ ] **Changelog** — Update [CHANGELOG.md](../CHANGELOG.md) with new version, date, and changes. For **minor/major** releases, add 2–3 bullet points so users see what actually changed (not just “Version bumped automatically”).
- [ ] **Security** — Run `./scripts/check-security.sh`. Resolve or document any HIGH/CRITICAL (see [SECURITY.md](../SECURITY.md)).
- [ ] **Tests** — `pytest tests/test_api_client.py tests/test_async_api_client.py tests/test_cli.py -v` (or `poetry run pytest`). All must pass. Optional live smoke: set `BLEUJS_API_KEY` and run `pytest tests/test_live_api_smoke.py -v`.
- [ ] **Type check** — `mypy src/bleujs`. No issues.
- [ ] **Build** — `python -m build` (or `poetry build`). Produces sdist and wheel.
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

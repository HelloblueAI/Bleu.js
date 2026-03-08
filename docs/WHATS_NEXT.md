# What's next: push the repo better than ever

Prioritized actions to make Bleu.js clearer, more trustworthy, and easier to contribute to—building on the recent security fixes, backend split, and OSS standards.

**Done:** [Product architecture](PRODUCT_ARCHITECTURE.md) added; duplicate/one-off docs moved to [docs/archive/](archive/); coverage-only tests moved to [tests/archive/](archive/); root `main.py` and `src/python/backend` marked as non-product; [README](../README.md) and doc links updated.

---

## 1. Quick wins (this week)

| Action | Why |
|--------|-----|
| **ROADMAP** | Already refreshed (v1.3.x, real links). Keep it updated. |
| **Bulk-dismiss obsolete Dependabot alerts** | Per [DEPENDABOT_AND_DEPENDENCIES.md](DEPENDABOT_AND_DEPENDENCIES.md), dismiss alerts for `backend/` and removed manifests so the Security tab reflects only root pip, collaboration-tools npm, Docker, Actions. |
| **Add a short “Recent security hardening” note** | In [SECURITY.md](../SECURITY.md) or a one-line in README: mention auth/JWT fix, CSRF option, secret validation, no DB URL logging, CORS/CSP tightening (link to CHANGELOG or a small `docs/SECURITY_HARDENING.md` if you add it). |

---

## 2. Release & changelog quality

| Action | Why |
|--------|-----|
| **Tighten when auto-release runs** | Right now any push to `main` (excluding docs) bumps version and creates a release. Consider: only bump on version-file change, or when a label/tag is pushed, so CHANGELOG isn’t mostly “Automatic Release” entries. |
| **Curate CHANGELOG for notable releases** | For minor/major (or “highlight” releases), add 2–3 bullet points so users see what actually changed. Keep auto-bump for patch; hand-edit for minor/major. |
| **Single source of version** | Ensure `src/version.py`, `pyproject.toml`, `setup.py`, and CHANGELOG header stay in sync (script or CI check). |

---

## 3. Documentation & discoverability

| Action | Why |
|--------|-----|
| **Fix ROADMAP links** | Replace placeholder “yourusername”, “your-server”, “docs.bleu.js” with real repo/discussions/docs links. |
| **“Getting started” path** | One doc or README section: “5-minute start” (install → set API key → one SDK call + one CLI command). Already partly in README; make it unmissable. |
| **API contract in one place** | [API_CLIENT_GUIDE.md](API_CLIENT_GUIDE.md#api-contract-and-response-shapes) is the contract; link it from README, CONTRIBUTING, and OPEN_SOURCE_STANDARDS so backend and clients stay aligned. |

---

## 4. CI & quality

| Action | Why |
|--------|-----|
| **Run tests in main.yml** | If not already: run pytest (or your test suite) on every PR/push to main so “Tests Passing” badge is meaningful. |
| **Optional: coverage gate** | Fail or warn if coverage drops below a threshold (e.g. 70%) so new code doesn’t shrink coverage. |
| **Backend repo parity** | In [Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend): add a minimal CI (lint + test), README, and SECURITY.md so both repos feel production-ready. |

---

## 5. Community & contribution

| Action | Why |
|--------|-----|
| **Good first issues** | Keep 3–5 “good first issue” labels so new contributors can find a clear entry point. |
| **PR template** | Remind “run tests / security script” and “no secrets” in the PR template so every PR is checked. |
| **One “Contributing” path** | Root CONTRIBUTING → full guide in docs is good; add one sentence: “New? Start with [Contributor guide](docs/CONTRIBUTOR_GUIDE.md) or a [good first issue](https://github.com/HelloblueAI/Bleu.js/issues?q=is%3Aopen+label%3A%22good+first+issue%22).” |

---

## 6. Security & compliance (ongoing)

| Action | Why |
|--------|-----|
| **Keep security script in the loop** | Every few months run `./scripts/check-security.sh` before a release; document in SECURITY.md or release checklist. |
| **Production checklist** | In SECURITY.md, keep a short “Production deploy” list: env secrets, no dev defaults, CSRF if using browser forms, CORS origins, DB password set. |
| **No re-adding backend** | Reminder in CONTRIBUTING or DEPENDABOT doc: do not re-add `backend/` to this repo; use the separate backend repo. |

---

## 7. Optional polish

- **Badges:** Add a “Security” or “Safety” badge if you run Safety Scan in CI and make the results visible.
- **Discord/community link:** If you have a real Discord/slack, put it in README and SUPPORT.md and fix ROADMAP.
- **Release notes on GitHub:** For minor/major releases, write 2–3 sentences in the GitHub release description so the repo feels maintained.

---

## Summary order

1. **ROADMAP + ROADMAP links** (accuracy and trust).
2. **Dependabot alert cleanup** (Security tab reflects reality).
3. **One security-hardening note** (SECURITY.md or README).
4. **Auto-release rules + CHANGELOG curation** (clearer releases).
5. **Tests in CI + optional coverage** (quality signal).
6. **Backend repo CI + README** (parity).
7. **Good first issues + single “start here” link** (contributor experience).

Use this as a living checklist; tick items as you go and add new ones as the project evolves.

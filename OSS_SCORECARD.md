# OSS Scorecard — Bleu.js

**OSS health:** **87/100** (2026-06-23)
**Package version:** `1.5.40` ([`pyproject.toml`](pyproject.toml), [`src/bleujs/__init__.py`](src/bleujs/__init__.py))
**Repository:** [HelloblueAI/Bleu.js](https://github.com/HelloblueAI/Bleu.js)

Honest snapshot for contributors and maintainers. Not a marketing claim — see [gaps](#actionable-gaps) below.

---

## Score by dimension

| Dimension | Weight | Score (1–10) | Weighted | Evidence |
|-----------|--------|--------------|----------|----------|
| License & governance | 15% | 9.5 | 14.3 | MIT, [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md), [CONTRIBUTING](CONTRIBUTING.md), [MAINTAINERS](MAINTAINERS.md), [SECURITY](SECURITY.md), [IP policy](docs/IP_AND_CONTRIBUTIONS.md) |
| Onboarding | 20% | 9.0 | 18.0 | README **177** lines; [GET_STARTED](docs/GET_STARTED.md); pinned starter issues [#234–#236](https://github.com/HelloblueAI/Bleu.js/issues) |
| CI / quality | 20% | 8.0 | 16.0 | Main workflow green; test coverage **~41%** (threshold 30%; target 60%) |
| Security hygiene | 15% | 7.5 | 11.3 | `./scripts/check-security.sh`; **~30** open Dependabot alerts (down from legacy ~1.5k); [hygiene runbook](docs/SECURITY_TAB_HYGIENE.md) |
| Docs clarity | 15% | 8.5 | 12.8 | Archive taxonomy, slim README, [PACKAGE_MAP](docs/PACKAGE_MAP.md); **53** top-level `docs/*.md` (dedup optional) |
| Contributor UX | 15% | 9.5 | 14.3 | Issue/PR templates; [CONTRIBUTOR_GUIDE](docs/CONTRIBUTOR_GUIDE.md); 3× `good first issue` + 2× `help wanted` |

**Total:** **87/100** (sum of weighted column; 86.7 before rounding)

---

## Metrics snapshot

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| `README.md` lines | 177 | ≤280 | ✅ |
| Open `good first issue` | 3 | ≥3 | ✅ |
| PyPI project URLs | homepage + repo + docs | set | ✅ |
| Public docs vs archive | maintainer handoffs in `docs/archive/maintainer/` | separated | ✅ |
| Backend issue templates | pending [PR 8](docs/OSS_CLEANUP_PLAN.md#pr-8--backend-oss-polish-bleujs-backend) | 3 | 🔄 |
| Dependabot open alerts | ~30 | <50 | ✅ |

---

## OSS cleanup progress

Tracked in [docs/OSS_CLEANUP_PLAN.md](docs/OSS_CLEANUP_PLAN.md).

| PR | Status |
|----|--------|
| 1 Docs taxonomy | ✅ |
| 2 README slim-down | ✅ |
| 3 IP clarity | ✅ |
| 4 PyPI metadata | ✅ |
| 5 Health scorecard | ✅ (this file) |
| 6 Security tab hygiene | ✅ runbook |
| 7 Good first issues | ✅ |
| 8 Backend templates | 🔄 |
| 9 Docs dedup | optional |
| 10 Final scorecard | after 8–9 |

---

## Actionable gaps

| Gap | Priority | Tracking |
|-----|----------|----------|
| Raise test coverage 41% → 60% | High | separate epic |
| Backend issue templates | Medium | OSS PR 8 |
| `markdown-link-check` in CI | Medium | [#237](https://github.com/HelloblueAI/Bleu.js/issues/237) |
| Docs dedup (install/quickstart) | Low | OSS PR 9 (optional) |
| MkDocs / GitHub Pages | Low | deferred in plan |
| Beta → Stable badge | Product | milestone |

---

## How to refresh this scorecard

```bash
# Version
grep '^version' pyproject.toml

# README size
wc -l README.md

# Good first issues
gh issue list --label "good first issue" --state open

# Dependabot open count (requires repo admin token)
gh api repos/HelloblueAI/Bleu.js/dependabot/alerts --jq 'length'

# Local security
./scripts/check-security.sh
```

Update scores quarterly or after major OSS cleanup PRs.

---

*Supersedes the static [REPOSITORY_HEALTH_REPORT.md](REPOSITORY_HEALTH_REPORT.md) (May 2026).*

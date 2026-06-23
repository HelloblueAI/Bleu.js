# OSS Cleanup Plan — Bleu.js + Bleujs.-backend

**Goal:** Move from “strong OSS foundation” (~85/100) to “reference-grade OSS” (~95/100) without breaking installs, CI, or external links.

**Principles**

- **Small PRs** — one concern per PR; each mergeable in &lt;30 minutes review.
- **Link hygiene** — every move gets a redirect stub or `grep`-verified link update in the same PR.
- **No behavior changes** until PR 7+ (metadata and docs only for PRs 1–6).
- **Measure** — capture before/after metrics in PR 1; re-measure in the final PR.

**Repos**

| Repo | Local path | GitHub |
|------|------------|--------|
| Main SDK | `Bleu.js` | `HelloblueAI/Bleu.js` |
| Backend | `Bleu.js-backend-export` | `HelloblueAI/Bleujs.-backend` |

**Suggested branch prefix:** `oss-cleanup/pr-N-short-name`

---

## Before you start (30 min, maintainer-only)

```bash
# Baseline metrics — paste output into PR 1 description
cd Bleu.js
wc -l README.md docs/*.md docs/archive/*.md 2>/dev/null | tail -1
rg -l 'docs/BLEUJS_ORG|docs/MESSAGE_FOR|docs/archive' --glob '*.md' | wc -l
rg 'BLEUJS_ORG_HANDOFF|MESSAGE_FOR_BLEUJS' --glob '*.{md,yml,rst}' -c || true

# Confirm CI green on main
gh run list --limit 3
```

| Metric | Baseline (fill in) | Target |
|--------|-------------------|--------|
| `README.md` lines | ~1,101 | ≤280 |
| Top-level `docs/*.md` count | ~56 | ≤25 “public” + archive index |
| Public docs linking internal handoffs | TBD | 0 |
| `REPOSITORY_HEALTH_REPORT.md` version | 1.5.15 (stale) | matches `pyproject.toml` |
| Backend issue templates | 0 | 3 |
| PyPI project URLs | missing | homepage + repository + docs |
| Labeled `good first issue` | TBD | ≥3 |

---

## PR 1 — Docs taxonomy + archive index (Bleu.js) ✅ *Done 2026-06-22*

**Branch:** `oss-cleanup/pr-1-docs-taxonomy`
**Risk:** Low (moves + index only)
**Review time:** ~20 min

### What

Introduce a clear **three-tier** docs model and move maintainer/ops docs out of the contributor path.

| Tier | Path | Audience |
|------|------|----------|
| **Public** | `docs/` (curated list below) | Users + contributors |
| **Archive** | `docs/archive/` | Historical reference; not linked from README |
| **Maintainer** | `docs/maintainer/` (new, gitignored contents) | Copy-paste handoffs; **not** in public clone by default |

> **Note:** `docs/internal/` already exists with gitignore. Use `docs/maintainer/` for ops handoffs that *were* public but shouldn’t be in the default tree — OR move them to `docs/archive/maintainer/` if you prefer everything stay in git (recommended for transparency).

### Move to `docs/archive/maintainer/` (recommended — stays in git, clearly labeled) ✅

```
docs/archive/maintainer/MESSAGE_FOR_BLEUJS_ORG_DEVELOPER.md
docs/archive/maintainer/BLEUJS_ORG_HANDOFF_2026-03-v1.4.16.md
docs/archive/maintainer/BLEUJS_ORG_UPDATE_HANDOFF_2026-03.md
docs/archive/maintainer/BLEUJS_ORG_REVIEW_2026-03.md
docs/archive/maintainer/BLEUJS_ORG_WEBSITE_CHECKLIST.md
docs/archive/maintainer/FEEDBACK_AUDIT_v1.3.29.md
docs/archive/maintainer/BUGS_FOUND_AND_FIXES.md
docs/archive/maintainer/POETRY_FIX.md
docs/archive/maintainer/ISSUES_AND_SOLUTIONS.md
```

**Keep in public `docs/`** (contributor-facing):

```
GET_STARTED.md, QUICKSTART.md, INSTALLATION.md, API_CLIENT_GUIDE.md,
API_REFERENCE.md, CONTRIBUTING.md, CONTRIBUTOR_GUIDE.md, ROADMAP.md,
REPOSITORIES.md, BACKEND_REPO.md, CHANGING_THE_API.md, SECURITY (root),
DEPENDABOT_AND_DEPENDENCIES.md, PRODUCT_ARCHITECTURE.md, WHO_SERVES_THE_API.md,
EVALUATION_AND_AWARDS.md, OPEN_SOURCE_STANDARDS.md, RELEASE_CHECKLIST.md
```

### Add `docs/archive/README.md` (replace or expand existing)

```markdown
# Archive

Historical and maintainer runbooks. **Not the primary path for new contributors.**

- **User docs:** start at [GET_STARTED](../GET_STARTED.md) or the root [README](../../README.md).
- **Maintainer handoffs:** [maintainer/](maintainer/) — org sync, deploy notes, audits.
- **Legacy guides:** older install/CI/upload docs from project history.

Do not add new docs here; add to `docs/` (public) or `docs/maintainer/` (ops).
```

### Link updates (same PR)

```bash
rg 'MESSAGE_FOR_BLEUJS|BLEUJS_ORG_HANDOFF|BLEUJS_ORG_UPDATE_HANDOFF|BLEUJS_ORG_REVIEW|BLEUJS_ORG_WEBSITE_CHECKLIST|FEEDBACK_AUDIT_v1.3.29|BUGS_FOUND_AND_FIXES|POETRY_FIX|ISSUES_AND_SOLUTIONS' \
  --glob '*.{md,rst,yml}' -l
```

Update every hit. Prefer links to **public** docs (`BLEUJS_ORG_CLAIMS_ALIGNMENT.md` stays public — it’s the contract with bleujs.org).

### Acceptance criteria

- [x] `rg` for moved filenames under `docs/` (not in archive) returns 0 stale paths
- [x] `docs/archive/README.md` and `docs/archive/maintainer/README.md` index the archive
- [x] `CONTRIBUTING.md` points to archive for maintainer docs
- [x] CI passes (docs-only; no code change required)

---

## PR 2 — README slim-down (Bleu.js)

**Branch:** `oss-cleanup/pr-2-readme-slim`
**Depends on:** PR 1 (optional; can parallel if careful)
**Risk:** Medium (high visibility; many inbound links)

### Target structure (~250 lines)

```markdown
# Bleu.js
[badges — keep 4 max: Python, License MIT, Status Beta, PyPI]

## What is Bleu.js?          (5–8 lines)
## Get started in 60 seconds  (install → key → bleu chat — KEEP)
## For developers             (clone, pip install -e ., table — KEEP)
## Documentation map          (NEW — table of 8–10 links, nothing else)
## SDK quick reference        (trim current § to ~40 lines; link to API_CLIENT_GUIDE)
## Optional extras            (ml / quantum / deep / server — table)
## Architecture (one diagram)  (link PRODUCT_ARCHITECTURE + REPOSITORIES)
## Contributing               (5 lines + links)
## License
```

### Move out of README (create or use existing docs)

| README section (line ~) | Destination |
|-------------------------|-------------|
| Quantum-Enhanced Vision Achievements (440+) | `docs/ACHIEVEMENTS.md` (new, short) |
| Key Features (502+) | merge into `docs/PRODUCT_PHILOSOPHY.md` or `GET_STARTED.md` |
| Examples (622+) | already have `examples/README.md` — link only |
| Docker Setup (687+) | `docs/INSTALLATION.md#docker` |
| Performance Metrics (818+) | `docs/PERFORMANCE.md` (new or archive extract) |
| System Architecture / Data Flow / Model Architecture (853+) | `docs/PRODUCT_ARCHITECTURE.md` |
| Development Setup duplicate (996+) | `docs/CONTRIBUTING.md` only |
| Additional Resources (1044+) | `docs/README.md` index |

### Acceptance criteria

- [ ] `wc -l README.md` ≤ 280
- [ ] GitHub renders correctly (badges, demo links, code blocks)
- [ ] PyPI readme still valid (`readme = "README.md"` in pyproject)
- [ ] No broken anchors: `markdown-link-check` or manual spot-check top 10 links

---

## PR 3 — IP clarity for patent / award drafts (Bleu.js)

**Branch:** `oss-cleanup/pr-3-ip-notice`
**Risk:** Low (docs only; legal clarity)

### What

Move patent drafts to archive and add a single **IP & contributions** notice.

**Move:**

```
src/bleu_ai/docs/patent_application.md  → docs/archive/ip/patent_application.md
src/bleu_ai/docs/award_submission.md    → docs/archive/ip/award_submission.md
docs/archive/patent_application.md      → docs/archive/ip/patent_application-legacy.md (if duplicate)
```

**Add:** `docs/IP_AND_CONTRIBUTIONS.md` (short, public)

```markdown
# IP and contributions

- **License:** MIT — see [LICENSE](../LICENSE).
- **Contributions:** You retain copyright; you license contributions under MIT (see CONTRIBUTING).
- **Patents:** Helloblue may pursue patent protection for certain techniques.
  Archived draft materials are in [docs/archive/ip/](archive/ip/) for historical reference only;
  they do not grant license to Helloblue patents. Questions: security@ / support@ contact in README.
- **Trademarks:** "Bleu.js" and bleujs.org branding are Helloblue marks; use nominatively when referring to this project.
```

Link from `CONTRIBUTING.md` (one line). Do **not** link from README hero.

### Acceptance criteria

- [ ] No `patent_application.md` under `src/` (avoid implying shipped product includes patent spec)
- [ ] `CONTRIBUTING.md` links to `IP_AND_CONTRIBUTIONS.md`
- [ ] CI unchanged

---

## PR 4 — PyPI metadata + package map (Bleu.js)

**Branch:** `oss-cleanup/pr-4-pypi-metadata`
**Risk:** Low

### `pyproject.toml` — add under `[tool.poetry]`

```toml
homepage = "https://bleujs.org"
repository = "https://github.com/HelloblueAI/Bleu.js"
documentation = "https://github.com/HelloblueAI/Bleu.js/blob/main/docs/GET_STARTED.md"
```

(Poetry 1.2+ uses these fields on the package; verify with `poetry build` / `pip install .` locally.)

### Add `docs/PACKAGE_MAP.md`

| Path | Package name | Role | Install |
|------|--------------|------|---------|
| `/` (root) | `bleu-js` | **Canonical** SDK + CLI | `pip install bleu-js` |
| `python/` | `bleu-ai` | Legacy / research subtree | Not published from this workflow |
| `src/quantum_py/` | separate | Quantum experiments | Optional; document only |

One paragraph in `CONTRIBUTING.md`: “**Canonical package is `bleu-js` at repo root.**”

### Acceptance criteria

- [ ] `poetry build` succeeds
- [ ] Next PyPI release shows Homepage + Repository links
- [ ] `PACKAGE_MAP.md` linked from CONTRIBUTOR_GUIDE

---

## PR 5 — Refresh health report + OSS scorecard (Bleu.js)

**Branch:** `oss-cleanup/pr-5-health-scorecard`
**Risk:** Low

### Replace optimistic static report with honest scorecard

**Update** `REPOSITORY_HEALTH_REPORT.md` → rename or supersede with `OSS_SCORECARD.md`:

| Dimension | Weight | Score (1–10) | Evidence |
|-----------|--------|--------------|----------|
| License & governance | 15% | | MIT, CoC, CONTRIBUTING, SECURITY |
| Onboarding | 20% | | README length, GET_STARTED, examples |
| CI / quality | 20% | | workflow pass rate, coverage % |
| Security hygiene | 15% | | secrets scan, Dependabot open count |
| Docs clarity | 15% | | public vs archive ratio |
| Contributor UX | 15% | | good first issues, PR template |

- Auto-fill version from `pyproject.toml` (`1.5.40` at time of writing).
- Replace “PRODUCTION READY” banner with “**OSS health:** X/100 (date)”.
- Link to this cleanup plan; check off items as PRs merge.

### Acceptance criteria

- [ ] Version matches `src/bleujs/__init__.py` and `pyproject.toml`
- [ ] No claim of “perfect” — actionable gaps listed
- [ ] `REPOSITORY_HEALTH_REPORT.md` redirects: “See OSS_SCORECARD.md”

---

## PR 6 — Security tab cleanup runbook (Bleu.js, maintainer PR)

**Branch:** `oss-cleanup/pr-6-dependabot-cleanup`
**Risk:** Low (scripts + docs; optional script execution by maintainer)

### What

1. Run (dry-run first) per `SECURITY.md`:
   ```bash
   ./scripts/dismiss-backend-dependabot-alerts.sh --dry-run
   ./scripts/dismiss-trivy-code-scanning-alerts.sh --dry-run
   ```
2. Add `docs/SECURITY_TAB_HYGIENE.md` — when to dismiss vs fix; expected open alert count after cleanup.
3. Update `SECURITY.md` “Known vulnerabilities” table with **target** open alert count post-cleanup.

### Acceptance criteria

- [ ] GitHub Security → Dependabot open alerts &lt; 50 (or documented exceptions)
- [ ] No new high/critical unmitigated in default `pip install bleu-js` tree
- [ ] `./scripts/check-security.sh` passes locally

---

## PR 7 — Good first issues + contributor funnel (Bleu.js, GitHub UI)

**Branch:** N/A — GitHub labels + 3–5 issues
**Can run in parallel with PR 1–2**

### Create labels

- `good first issue` (green)
- `help wanted`
- `docs` (for README/archive PR follow-ups)

### Seed issues (templates)

| Title | Label | Effort |
|-------|-------|--------|
| Add test for `BleuAPIClient` timeout handling | good first issue | 2–4 h |
| Fix markdown lint in `examples/README.md` | good first issue | 30 min |
| Add `markdown-link-check` to CI (docs only) | help wanted | 2 h |
| Document `bleu-js[server]` env vars in INSTALLATION | docs | 1 h |
| Align openapi.yaml example with chat response shape | help wanted | 3 h |

Reference them from `CONTRIBUTOR_GUIDE.md` (already mentions 3–5 issues).

### Acceptance criteria

- [ ] ≥3 open `good first issue` at all times
- [ ] Each issue has “Expected outcome” + “How to verify”

---

## PR 8 — Backend OSS polish (Bleujs.-backend)

**Branch:** `oss-cleanup/pr-8-backend-templates`
**Repo:** `Bleu.js-backend-export`

### 8a — Issue templates

Add `.github/ISSUE_TEMPLATE/` (mirror main repo style):

- `bug_report.md` — steps, expected, version (`npm run` / `predict_api.py`)
- `feature_request.md` — API contract impact yes/no
- `config.yml` — link to main repo for SDK issues

### 8b — `.elasticbeanstalk/` hygiene

- Add to `.gitignore`: `.elasticbeanstalk/saved_configs/` (local backups)
- Keep `.elasticbeanstalk/config.yml` if team uses EB CLI, **or** move deploy docs to `docs/DEPLOY_ELASTIC_BEANSTALK.md` and gitignore entire `.elasticbeanstalk/`

### 8c — Experimental `src/` clarity

Add `src/README.md`:

```markdown
# Legacy / experimental services

Not wired into `index.mjs` or `predict_api.py`. Do not deploy.
Production paths: `index.mjs` (stub), `predict_api.py` (ML).
```

### 8d — Cross-link cleanup plan

One line in backend `README.md` → main repo `docs/OSS_CLEANUP_PLAN.md`

### Acceptance criteria

- [ ] `npm test` passes
- [ ] New issue template visible on GitHub “New issue”
- [ ] README “What’s in this repo” unchanged in meaning

---

## PR 9 — Docs dedup + INSTALLATION merge (Bleu.js, optional)

**Branch:** `oss-cleanup/pr-9-docs-dedup`
**Risk:** Medium (many links)

### Candidates to merge

| Keep | Merge / redirect |
|------|------------------|
| `docs/INSTALLATION.md` | `docs/INSTALLATION_GUIDE.md` → redirect stub |
| `docs/QUICKSTART.md` | ensure single canonical quickstart; other links to it |
| `docs/API.md` | redirect to `API_CLIENT_GUIDE.md` |
| `docs/local-development.md` | into `CONTRIBUTING.md#development-setup` |

### Acceptance criteria

- [ ] One canonical install doc, one quickstart
- [ ] `rg 'INSTALLATION_GUIDE' --glob '*.md'` only hits redirect stubs

---

## PR 10 — Final scorecard + announcement (Bleu.js)

**Branch:** `oss-cleanup/pr-10-scorecard-final`
**Depends on:** PRs 1–6, 8–9

### What

1. Re-run baseline metrics; update `OSS_SCORECARD.md` to target ≥95/100.
2. Add `CHANGELOG.md` entry under **Documentation / OSS**.
3. Optional: short GitHub Discussion “OSS cleanup complete — how to contribute now”.

### Acceptance criteria

- [ ] All checkboxes in this plan marked done or explicitly deferred with issue links
- [ ] README ≤280 lines, ≥3 good first issues, PyPI URLs live, backend issue templates exist

---

## Execution order (Gantt-style)

```
Week 1:  PR1 (taxonomy) ──► PR2 (README) ──► PR4 (PyPI metadata)
         PR7 (issues) in parallel
Week 2:  PR3 (IP) ──► PR5 (scorecard) ──► PR6 (security tab)
Week 3:  PR8 (backend) ──► PR9 (dedup, optional) ──► PR10 (final)
```

**Merge order matters for:** PR2 after PR1 (fewer README links to moved docs). PR10 last.

---

## Deferred (track as issues, not blockers)

| Item | Why defer | Tracking issue title |
|------|-----------|----------------------|
| Raise test coverage 41% → 60% | Code work; separate epic | `test: coverage push to 60%` |
| `markdown-link-check` in CI | PR7 issue | `ci: link check on docs/` |
| MkDocs site publish | Hosting decision | `docs: publish mkdocs to GitHub Pages` |
| Consolidate `python/` + `quantum_py` | Breaking change risk | `refactor: document or retire sub-packages` |
| Beta → Stable badge | Product decision | milestone-based |

---

## Review checklist (every PR)

- [ ] No secrets, no `.env` commits
- [ ] `rg` for broken internal doc paths
- [ ] CI green
- [ ] CHANGELOG entry if user-visible
- [ ] External links (bleujs.org, PyPI, HF) still correct

---

## Success definition — “make us proud”

When this plan is complete, a **new contributor** should be able to:

1. Read the README in **under 5 minutes** and run `pip install bleu-js` + `bleu chat`.
2. Find **one** contributing guide and **one** install guide without wading through org handoffs.
3. Open **3+ good first issues** and know which repo to use (SDK vs backend).
4. See **accurate** health/scorecard and **MIT + IP** clarity before submitting a PR.
5. Trust the **Security** tab isn’t drowning in 1,500 legacy alerts.

That is reference-grade OSS hygiene for a beta, multi-repo AI platform — honest about status, ruthless about clutter, generous about onboarding.

---

*Plan authored: 2026-06-22. Maintainer: update checkboxes as PRs land.*

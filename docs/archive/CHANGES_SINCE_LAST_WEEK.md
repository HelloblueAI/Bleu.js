# Changes since last week (comparison)

Reference: **1 week ago** = `6be01416` → **now** = `HEAD`.
**53 commits**, **82 files** changed, **+2,227 / -2,430** lines (net -203).

---

## 1. Repo structure & backend

| Change | Before | After |
|--------|--------|-------|
| **Backend in repo** | `backend/` tracked (Node + Python, many manifests) | **Stopped tracking** `backend/` (still in `.gitignore`); lives in separate repo [Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend) |
| **Dependabot scope** | Scanned root + backend → ~1500 alerts | Scans only root pip, collaboration-tools npm, Docker, GitHub Actions → manageable alerts |
| **New docs** | — | `docs/BACKEND_REPO.md`, `docs/DEPENDABOT_AND_DEPENDENCIES.md`, `scripts/export-backend-repo.sh` |
| **Backend files** | Present in tree | **Removed from git** (30+ files: Dockerfile, package.json, inference, predict_api, services, models, etc.) |

---

## 2. Security

| Change | Before | After |
|--------|--------|-------|
| **Local security script** | None | `scripts/check-security.sh` — runs pip-audit, Safety scan, optional Trivy |
| **SECURITY.md** | Basic | **Expanded:** API keys note, “Check security locally”, pipx/venv + **Safety quickstart** (install, auth, scan) |
| **Safety CLI** | `safety check` (deprecated) | **`safety scan`** in CI, docs, and local script |
| **CI security step** | Safety check (deprecated) | **Safety Scan** (`.github/workflows/main.yml`) |
| **Dependency pins (pyproject)** | Some | **Added:** aiohttp ^3.13.3, starlette ≥0.49.1, filelock ≥3.20.3, werkzeug ≥3.1.6, pyasn1 ≥0.6.2, python-multipart ≥0.0.22, virtualenv ≥20.36.1 (dev), **keras ≥3.13.2**, **torch ^2.8.0** |
| **Python** | ^3.10 | **≥3.11,<3.14** (keras 3.13 + torch 2.8 triton compat) |
| **requirements.txt** | Older bounds | aiohttp ≥3.13.3, starlette ≥0.49.1, python-multipart ≥0.0.22 |
| **Pillow / Docker** | — | Pillow ≥12.1.1 (CVE-2026-25990), bleu-os Dockerfile.production hardened (zlib, sqlite), `bleu-os/TRIVY_ALERTS.md` |
| **Docs** | — | `docs/SECURITY_FIXES_2025.md` — Safety scan table, Option A (Poetry) / Option B (pip), Poetry conflict note, protobuf/ray accepted |

---

## 3. Docs & community (OSS standards)

| Change | Before | After |
|--------|--------|-------|
| **Root CONTRIBUTING** | None | **CONTRIBUTING.md** (points to full guide in docs) |
| **Support** | — | **SUPPORT.md** (issues, discussions, security, docs, product) |
| **Code owners** | — | **.github/CODEOWNERS** (default @HelloblueAI) |
| **README** | Single block | **“Who it’s for”**, security/status/production, standards strip, links to BACKEND_REPO, OPEN_SOURCE_STANDARDS, Dependabot doc |
| **Code of Conduct link** | Broken from docs/ | **Fixed** in docs/CONTRIBUTING.md (../CODE_OF_CONDUCT.md) |
| **New/updated docs** | — | `docs/OPEN_SOURCE_STANDARDS.md`, `docs/DOCKER_AFTER_OS_UPGRADE.md`, `docs/QUANTUM_TELEPORTATION.md`; PROJECT_STRUCTURE, CONTRIBUTING, README_DEPENDENCIES, local-development updates |

---

## 4. CI/CD & workflows

| Change | Before | After |
|--------|--------|-------|
| **main.yml** | Safety check (deprecated) | **Safety Scan** (safety scan --output json), pip-audit |
| **welcome.yml** | — | **Permissions** added for CodeQL |
| **bleu-os.yml, docker-publish.yml, release.yml** | Older actions | **Dependabot** bumps: docker/build-push-action, docker/metadata-action, docker/login-action, docker/setup-buildx-action, actions/upload-artifact, actions/download-artifact |
| **dependabot.yml** | — | **Comments** clarifying scope (no backend); pip, npm, docker, github-actions only |

---

## 5. Dependencies (summary)

| Area | Before | After |
|------|--------|-------|
| **Pip (pyproject.toml)** | Older aiohttp, starlette, no keras/torch pins | aiohttp ^3.13.3, starlette ≥0.49.1, keras ≥3.13.2, torch ^2.8.0, filelock, werkzeug, pyasn1, python-multipart, virtualenv (dev); Python ≥3.11,<3.14 |
| **requirements.txt** | Older bounds | aiohttp ≥3.13.3, starlette ≥0.49.1, python-multipart ≥0.0.22 |
| **Other requirements** | — | requirements-basic, requirements-ci, requirements-minimal, setup.py version/constraints touched |
| **Dependabot merges** | — | python-patch-minor group, tensorflow, Docker and GitHub Actions bumps |

---

## 6. Features & code

| Change | Before | After |
|--------|--------|-------|
| **CLI** | — | **bleujs/cli.py** extended (+120 lines) |
| **Quantum** | — | **bleujs/teleportation.py** (+159), **bleujs/ibm_runtime.py** (+122), **tests/quantum/test_teleportation.py** (+42); docs/QUANTUM_TELEPORTATION.md |
| **API client** | — | **async_client** __del__ fix; **healthcare.py** empty-prediction guard |
| **Distributed** | — | **distributed_manager** dispose fix |
| **Version** | 1.3.38 → … | Bumped through **1.3.52** (version bumps in CHANGELOG/setup/version) |

---

## 7. Demo & API playground

| Change | Before | After |
|--------|--------|-------|
| **Animated demo** | Basic | **simple_animated_demo.html** — speed 1×/2×, no traffic lights, smooth scroll, a11y, Enter/R shortcuts, copy pip, reduced motion |
| **API playground** | None | **api_playground.html** (+416 lines) — Chat, Generate, Embed, Models; handles chat response shape and array error detail; linked from README |

---

## 8. Bleu-OS / Docker

| Change | Before | After |
|--------|--------|-------|
| **Dockerfile.production** | — | **Hardened:** zlib, libsqlite3-0; Pillow CVE; Trivy-oriented changes |
| **Other Dockerfiles** | — | bleu-os Dockerfile*, init-bleu-os.sh, README, VULNERABILITY_FIXES updates |
| **Trivy** | — | **bleu-os/TRIVY_ALERTS.md** — what’s fixed in image, kernel = host, jackson/ray note |
| **Scripts** | — | **scripts/docker-verify-and-run.sh** (+77) |

---

## 9. Metrics (before vs after)

| Metric | ~1 week ago | Now |
|--------|-------------|-----|
| **Commits (that week)** | — | **53** |
| **Files changed (vs then)** | — | **82** (+2,227 / -2,430) |
| **Backend in repo** | Yes (~30+ files) | **No** (moved to separate repo) |
| **Dependabot alerts (source)** | ~1500 (backend + root) | **Root-only** (pip, npm, docker, actions) |
| **Security script** | None | **./scripts/check-security.sh** |
| **Safety** | check (deprecated) | **scan** (CI + local) |
| **Fixable Safety vulns (in lock)** | Many (aiohttp, crypto, starlette, etc.) | **Reduced** (keras, torch updated; ray/protobuf accepted) |
| **Root CONTRIBUTING / SUPPORT / CODEOWNERS** | No | **Yes** |
| **API playground** | No | **Yes** |
| **Python** | ^3.10 | **≥3.11,<3.14** |

---

## 10. Commits (short list)

- Security: security tooling + dependency pins, Pillow CVE, zlib/Trivy, welcome workflow permissions.
- Backend: stop tracking backend/, BACKEND_REPO docs, export script, open source standards.
- Dependabot: scope tightened; merges for pip, docker actions, upload/download-artifact.
- Docs: README (who it’s for, security, status, production), SECURITY.md, CONTRIBUTING, SUPPORT, CODEOWNERS, OPEN_SOURCE_STANDARDS, DEPENDABOT_AND_DEPENDENCIES, DOCKER_AFTER_OS_UPGRADE, QUANTUM_TELEPORTATION, SECURITY_FIXES_2025.
- Features: API playground, quantum teleportation + IBM runtime, CLI extensions, healthcare/async_client/distributed fixes.
- Demo: simple_animated_demo UX.
- Version bumps: 1.3.39 → 1.3.52.

---

*Generated from `git log` and `git diff` from 1 week ago to HEAD.*

# Comparison: Now vs ~1 Month Ago

**Baseline:** 2026-02-02 (commit `78340780`, version 1.3.26)
**Current:** main (version 1.3.55)

---

## By the numbers

| Metric                       | Then (1.3.26) | Now (1.3.55) | Change                     |
| ---------------------------- | ------------- | ------------ | -------------------------- |
| **Version**                  | 1.3.26        | 1.3.55       | +29 patch releases         |
| **Commits (since baseline)** | —             | ~100         | —                          |
| **Files changed**            | —             | 343          | —                          |
| **Lines added**              | —             | ~5,200       | —                          |
| **Lines removed**            | —             | ~24,400      | **−19,200 net**            |
| **Files deleted**            | —             | 131          | Major cleanup              |
| **Files added**              | —             | 28           | New docs, tests, workflows |

**Bottom line:** The repo is ~19k lines smaller, with clearer product focus and stronger security.

---

## 1. Security

- **Auth:** JWT `sub` is user id (UUID) everywhere; no `int(user_id)`; `UserService.get_user` and token flow aligned.
- **Secrets:** Production/staging reject weak or default `SECRET_KEY` and `JWT_SECRET_KEY`; no empty secrets in Python backend.
- **CSRF:** Optional double-submit cookie; `ENABLE_CSRF_PROTECTION` and `GET /api/v1/csrf-token`.
- **CORS/CSP:** No `allow_origins=["*"]` with credentials; CSP tightened (no `unsafe-inline` / `unsafe-eval` for scripts).
- **XSS:** `escapeHtml()` and data attributes in dashboard templates for API-sourced data.
- **DB/logging:** No `DATABASE_URL` in logs; production requires DB password in `db_config`.
- **Dependencies:** PyJWT only (python-jose removed); Pillow pinned for CVE; keras/torch and Python 3.11+ pinned; attestations and minimal images for bleu-os.
- **SECURITY.md:** Updated with recent hardening and deployment checklist.

---

## 2. Product clarity

- **Single product:** bleujs.org = **`src/main.py`**; documented in `docs/PRODUCT_ARCHITECTURE.md`.
- **Run path:** `python -m uvicorn src.main:app ...` and venv instructions; quantum/ML vs R&D clarified.
- **Cleanup:** 50+ duplicate/one-off docs moved to `docs/archive/`; coverage-only tests to `tests/archive/` (excluded from default pytest); `backend/` removed from repo (moved to separate backend repo); `submission/`, `project-reports/`, demos `.cast` files removed or archived.
- **Root/alternate apps:** `main.py` and `src/python/backend/main.py` docstrings point to product app and PRODUCT_ARCHITECTURE.

---

## 3. Code and quality

- **UserService:** Real implementations for `get_user`, `get_user_by_email`, `update_user`, `delete_user`, `list_users`; `create_user` explicitly “use AuthService.”
- **Pre-commit:** black, isort, flake8, trailing whitespace, EOF; `.flake8` and `pytest.ini` (e.g. `norecursedirs = archive`).
- **Tests:** New `tests/test_product_app.py` (auth, subscription, health, title); quantum teleportation tests; API client tests updated.
- **Version:** Centralized in `src/version.py` and used by API/health.

---

## 4. Docs and workflows

- **New/updated:** PRODUCT_ARCHITECTURE, ROADMAP, WHATS_NEXT, SECURITY, BACKEND_REPO, OPEN_SOURCE_STANDARDS, DEPENDABOT_AND_DEPENDENCIES, CONTRIBUTOR_GUIDE/ONBOARDING/CONTRIBUTING links.
- **Workflows:** welcome workflow, upload-model-hf, Docker/bleu-os and attestations; Dependabot scope tightened.

---

## 5. Removed or archived (reduces noise)

- **backend/** — Moved to separate repo (BACKEND_REPO.md).
- **submission/** — ICML/award and one-off submission content removed.
- **docs/project-reports/** — Status and fix reports archived or removed.
- **50+ docs** — Moved to `docs/archive/` with README.
- **Coverage-only tests** — Moved to `tests/archive/` and excluded from default run.
- **netlify.toml**, demo `.cast` files, various one-off scripts — Removed or archived.

---

## Verdict

**You are in significantly better shape than one month ago:**

- **Security:** Hardened auth, secrets, CSRF, CORS/CSP, XSS, logging, and dependencies.
- **Product:** One clear app, one run command, archived cruft, and a single product narrative.
- **Quality:** UserService implemented where it matters, pre-commit and tests in place, version centralized.
- **Maintainability:** ~19k fewer lines, clearer docs, and a path for “what’s next” (WHATS_NEXT.md).

Safe to publish for users from a code and security standpoint, provided production env (secrets, DB, HTTPS, CORS) is set correctly.

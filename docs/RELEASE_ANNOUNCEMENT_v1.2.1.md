# 🚀 Bleu.js v1.2.1 – Python 3.12 Compatibility & Seamless Packaging

Bleu.js v1.2.1 is now live on PyPI! This focused release ensures every user can upgrade confidently to the latest Python ecosystem while continuing to enjoy the API client, optional quantum/ML extras, and polished documentation we shipped in 1.2.0.

---

## 🎯 Why 1.2.1 Matters

- **Python 3.12 Ready** – Core package, CLI, and examples all tested on Python 3.12.2 with a pyenv-managed toolchain.
- **Pydantic v2 Clean-Up** – Replaced deprecated validators/field arguments, added compatibility helpers, and eliminated noisy warnings.
- **Optional Extras, Optional Indeed** – GPUtil, Ray, and other heavy dependencies now import defensively so users without GPUs can still install without errors.
- **API Client Guaranteed** – MANIFEST updates and packaging checks ensure `bleujs.api_client` ships in every wheel and sdist.
- **Docs & Messaging Updated** – Installation guides, changelog, and CEO briefings point to the new version, keeping users on the happy path.

---

## 🔄 Upgrade Steps for Users

```bash
pip install --upgrade bleu-js==1.2.1
# or, to include the cloud API client extras
pip install --upgrade 'bleu-js[api]'==1.2.1
```

- No manual file moves required.
- Works on Python 3.10 → 3.12.
- API client imports directly via `from bleujs.api_client import BleuAPIClient`.

---

## ✅ Release Checklist

| Item | Status |
| --- | --- |
| Version bump in `pyproject.toml`, `setup.py`, package `__init__.py` | ✅ |
| Changelog + documentation refresh | ✅ |
| Fresh build (`sdist`, `wheel`) + `twine check` | ✅ |
| PyPI upload (token-authenticated) | ✅ |
| Smoke test: `pip install --no-cache-dir bleu-js==1.2.1` | ✅ |

---

## 📣 Suggested Announcement Copy

**Long form (LinkedIn / Blog)**
> 🚀 Bleu.js v1.2.1 is live!  
> • Certified Python 3.12 compatibility  
> • Pydantic v2 migration complete – no more deprecation warnings  
> • API client ships with every install, zero manual steps  
> • Docs and quick starts refreshed for a frictionless upgrade  
> Upgrade now: `pip install --upgrade bleu-js==1.2.1`

**Tweet / Short message**
> Bleu.js v1.2.1 just dropped → Python 3.12 ready, cleaner installs, API client included by default. `pip install bleu-js==1.2.1` 🎉

---

## 🧭 Looking Ahead

- Triage remaining legacy mega-tests and align CI with the modernized package.
- Continue dependency harmonization (numpy 2.x migration plan, optional extras).
- Ship simplified SDK wrapper proposed in the user guide once backend parity is finalized.

Let the team know once you’ve announced the release so we can monitor adoption metrics and user feedback!


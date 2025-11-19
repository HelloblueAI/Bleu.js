# 🧹 Post-Release Backlog (Tests & Typing)

Even though Bleu.js 1.2.1 is production-ready, the legacy test suite and strict mypy config still flag issues that pre-date the recent repairs. Track remediation here so we can schedule targeted work without blocking ongoing releases.

## ✅ Already Addressed
- Patched `tests/test_api_client.py` to use `bleujs.api_client` imports.
- Installed optional dependencies (boto3, shap, qiskit-aer) needed for deeper integration tests.
- Converted `GPUtil`/`ray` imports to soft dependencies to avoid hard failures.
- Documented Python 3.12 upgrade steps and environment setup.

## 🚧 Outstanding Test Failures
- Legacy mega-tests (`tests/test_massive_*`, `tests/test_new_code_*`, etc.) expect modules/services that were never production-ready.
- Monitoring middleware tests require refactors to align with simplified services.
- CSRF/CORS tests rely on outdated middleware implementations.
- Quantum attention/vision tests depend on Cirq gate APIs that have changed.
- API token/service tests target obsolete database schemas.

👉 Recommendation: Split these suites into (a) keep & fix, (b) archive/xfail, (c) delete. Capture decisions per directory before touching code.

## 🧾 mypy Cleanup
- ~268 errors concentrated in `quantum_py`, `python/ml`, and `bleu_ai` legacy modules.
- Many functions return `Any` despite annotated types; some mix ndarray/Tensor/Dict unions.
- Several files still import deprecated Pydantic/requests types without stubs.

👉 Recommendation: Create `mypy.ini` suppressions for archived modules, then modernize active code paths in batches (API, core, ML).

## 🔜 Next Steps
1. Catalogue which tests represent supported features post-1.2.1.
2. Draft RFC to retire/replace unused quantum prototypes.
3. Introduce targeted fixtures/mocks for services we continue to support.
4. Add CI job that runs the “supported” subset so future patches stay green.

Maintaining this list keeps us honest about the follow-up work while letting users enjoy the benefits of the new release today.


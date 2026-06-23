# Bleu.js feature audit (v1.3.29) – feedback and actions

**Source:** Pejman Haghighatnia, feature audit email
**Date:** March 2026

---

## Working well

- **CLI:** All commands work (`bleu` / `bleujs` / `bleu-js`, version, config, chat, generate, embed, models list/info, health). Clear errors when API key is missing.
- **API client:** Sync client with httpx, retries, timeouts. Chat, generate, embed, list_models. Pydantic models and typed errors. Endpoints `/api/v1/chat`, `/api/v1/generate`, `/api/v1/embed`, `/api/v1/models`.
- **Core:** `BleuJS().process(data)` works; optional numpy conversion; returns status/shape/metadata.
- **QuantumFeatureExtractor:** With Qiskit or PennyLane – real small circuits (RY + CNOT). Without – falls back to `_classical_simulation()` (cos/sin “quantum-like” features).
- **HybridTrainer (ML):** XGBoost / sklearn / simple fallback; optional quantum feature step before training.
- **PerformanceTracker:** In-memory metrics; start/stop/record. Fine for what it is.

---

## Not working / misleading – actions

### 1. quantum_enhanced flag when no quantum libs

**Issue:** With `quantum_mode=True` but no Qiskit/PennyLane, `process(..., quantum_features=True)` still returns `quantum_enhanced: True` even though no quantum code ran (extractor is None, data is passed through).

**Action:** Set `quantum_enhanced` only when the extractor actually ran.
**Status:** Fixed in `src/bleujs/core.py`: `quantum_enhanced` is now `True` only when `quantum_features and self.quantum_mode and self.quantum_extractor` (i.e. extractor was used).

---

### 2. QuantumAttention is not quantum

**Issue:** `QuantumAttention.process()` uses `np.random.randn(len(str(input_data)), dim)` then softmax-style weighting. No circuit, no real embedding. Name is misleading.

**Action:** Document clearly that this is a simulated/classical attention for API compatibility. Optionally rename to “SimulatedAttention” in a future release; for now docstring updated to avoid misleading “quantum-enhanced” claim.
**Status:** Docstring in `src/bleujs/quantum.py` updated to state that the implementation is a classical simulation (no quantum circuit).

---

### 3. “Quantum-resistant” crypto

**Issue:** `QuantumSecurityManager` “quantum-resistant” hash is 10× SHA-512; “military-grade” is Fernet (AES). No post-quantum crypto (e.g. Kyber, Dilithium). Naming overstates.

**Action:** Clarify in docstrings: “quantum-resistant” = multi-round SHA-512 (hardening, not NIST post-quantum). Add sync wrappers for `encrypt`, `generate_hashes`, `verify_integrity` so sync callers don’t need to manage event loops.
**Status:** Class and method docstrings updated; `encrypt_sync`, `generate_hashes_sync`, `verify_integrity_sync` added.

---

### 4. Security API async-only

**Issue:** `encrypt()`, `generate_hashes()`, `verify_integrity()` are only async. No sync wrappers.

**Action:** Add sync versions (e.g. `encrypt_sync` that runs the async version via `asyncio.run`).
**Status:** Implemented in `src/bleujs/security.py`: `encrypt_sync`, `generate_hashes_sync`, `verify_integrity_sync`.

---

### 5. No dedicated /health in client

**Issue:** CLI “bleu health” uses `list_models()` as a proxy. If the API has a `/health` endpoint, expose it in the client and use it for health.

**Action:** Add `health()` method to sync and async API clients (GET `/health` per openapi.yaml). CLI uses `client.health()` when available, with fallback to `list_models()` for backward compatibility.
**Status:** `BleuAPIClient.health()` and `AsyncBleuAPIClient.health()` added; CLI health command calls `health()` first, then falls back to `list_models()` if not available or on error.

---

### 6. Full install fragile (numba/llvmlite via shap)

**Issue:** Default `pip install` pulls numba/llvmlite (via shap), which often fail to build. A lighter default or clear “bleu-js[api]” path would help.

**Clarification:** Default `pip install bleu-js` does **not** install shap. shap is only in extras `[deep]` and `[all]`. So:
- `pip install bleu-js` → minimal (numpy, click, httpx, etc.) for CLI + API.
- `pip install bleu-js[deep]` or `bleu-js[all]` → pulls in torch, tensorflow, shap (and thus numba/llvmlite). Build issues are with the full stack, not the default.

**Action:** Document in INSTALLATION.md and README that the default install is lightweight for CLI + cloud API; heavy ML/quantum stacks are under `[ml]`, `[quantum]`, `[deep]`, `[all]`.
**Status:** Noted in this audit; optional doc update in INSTALLATION.md to state “Default install is CLI + API only; use [ml]/[quantum]/[deep]/[all] for heavy deps.”

---

## Summary

| Area        | Status |
|------------|--------|
| quantum_enhanced flag | Fixed: only True when extractor ran |
| QuantumAttention      | Docstring: classical simulation, not quantum |
| QuantumSecurityManager| Docstring: clarify multi-SHA-512; sync wrappers added |
| Security async-only   | Sync wrappers added |
| /health in client     | health() added; CLI uses it |
| Install weight        | Clarified: default is light; shap only in [deep]/[all] |

---

**Changelog:** Add an entry for the next release referencing this audit and the fixes above.

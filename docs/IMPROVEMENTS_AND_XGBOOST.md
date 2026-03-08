# System and XGBoost Improvements

Summary of improvements made to the Bleu.js codebase and the Enhanced XGBoost path.

## Enhanced XGBoost (`src/ml/enhanced_xgboost.py`)

### Fixes applied

1. **fit() order and optimizer**
   - `optimize_batch_size()` was called with `self.model` before the model was created. It now accepts `model=None` and is called with `None`; the method only uses feature shape and config, so training no longer fails.

2. **XGBoost 2.x TrainingCallback API**
   - Replaced incorrect `TrainingCallback(lambda ...)` usage with a proper subclass `_TrainingHistoryCallback` that implements `after_iteration(self, model, epoch, evals_log)` and records metrics. Training history is now logged correctly and tests that previously failed with "TrainingCallback API issue" pass.

3. **Sklearn API compatibility**
   - `eval_metric` and `early_stopping_rounds` are not accepted by `XGBClassifier.fit()` in this XGBoost version; they are set on the constructor. `early_stopping_rounds` and `callbacks` are only added when `eval_set` is provided (early stopping requires a validation set).

4. **save_model / load_model consistency**
   - Save uses `get_booster().save_raw()` (sklearn API); load uses `XGBClassifier.load_model(bytearray(model_data))` so in-memory bytes round-trip correctly. `save_model()` always writes a `.meta` JSON file (feature importance, training/validation history, optional signature). `load_model()` supports both encrypted and plain saves; when no encryption key is set, it loads raw bytes without decryption. Signature verification uses the raw (decrypted) bytes. Loading works when `.meta` is missing (metadata defaults to empty).

5. **Optuna deprecation**
   - Replaced `suggest_loguniform` / `suggest_uniform` with `trial.suggest_float(..., log=True)` and `trial.suggest_float(low, high)` in `optimize_hyperparameters()` for compatibility with current Optuna.

6. **Ray optional**
   - `EnhancedXGBoost` now accepts `enable_ray=True|False|None`. Default is `True` unless env `BLEUJS_DISABLE_RAY=1` (or `true`/`yes`). Ray init is wrapped in try/except so failures do not break construction.

7. **Deterministic quantum transformation**
   - `QuantumFeatureConfig` has `random_state: Optional[int] = None`. When set, `_apply_quantum_transformation` uses `np.random.default_rng(seed)` so save/load round-trip tests can assert exact prediction match.

### Tests

- All seven `TestEnhancedXGBoost` tests run and pass (no skips).
- `test_save_load_roundtrip` uses `QuantumFeatureConfig(random_state=42)` for deterministic predictions.

## Other XGBoost call sites (aligned)

- **`src/ml/train_xgboost.py`**
  - Ray init is optional: respects `config["enable_ray"]` and env `BLEUJS_DISABLE_RAY`.
  - `eval_metric` is set on `XGBClassifier` constructor; removed from `fit()`.
  - `save_model` / `load_model` use `save_model(path)` and `load_model(path)` (sklearn API) instead of `save_raw`/`load_raw`.
- **`src/bleu_ai/models/xgboost_model.py`**
  - `_initialize_base_components` sets default `eval_metric=["logloss", "auc"]` on the constructor when not in config.

## Remaining ideas

- **Security:** Keep addressing `./scripts/check-security.sh` findings (e.g. protobuf/ray in lockfile); see [SECURITY.md](../SECURITY.md).
- **Quantum “feature”:** For real quantum benefit, replace or augment the simulated transformation with actual circuit-based feature encoding when hardware/simulators are available.

## References

- [SECURITY.md](../SECURITY.md) — Known vulns, deployment checklist
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) — Pre-release and tag steps
- [XGBoost 2.0 callbacks](https://xgboost.readthedocs.io/en/release_2.0.0/python/callbacks.html) — Callback API
- [Optuna suggest_float](https://optuna.readthedocs.io/) — Replaces suggest_loguniform / suggest_uniform

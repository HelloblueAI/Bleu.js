# AGENTS.md

Guidance for cloud agents working in the Bleu.js repository.

## Cursor Cloud specific instructions

### Product overview

Bleu.js is a Python monorepo: PyPI SDK/CLI (`src/bleujs`), FastAPI product app (`src/main.py`), tests (`tests/`), and optional subpackages (`src/quantum_py`, `collaboration-tools`). The live production API at `api.bleujs.org` is hosted separately; this repo is for SDK, CLI, docs, and self-hosted app development.

### Dependency install

Use Poetry from the repo root (Python 3.11+). CI uses the `ci` extra (full stack minus `gputil`, which can fail in cloud VMs):

```bash
export PATH="$HOME/.local/bin:$PATH"
poetry config virtualenvs.in-project true
poetry install --no-interaction --extras ci --with dev
```

Activate the venv with `source .venv/bin/activate` or prefix commands with `poetry run`.

### Running the product app

No PostgreSQL or Redis is required for basic dev — SQLite is used by default.

```bash
poetry run python main.py
# or: poetry run python -m uvicorn src.main:app --reload --port 8000
```

- Health: `http://127.0.0.1:8000/health`
- Swagger UI: `http://127.0.0.1:8000/docs`
- Home page: `http://127.0.0.1:8000/`

Use tmux for long-running servers (e.g. session `bleu-fastapi`).

### CLI / SDK

```bash
poetry run bleu version
poetry run python -c "from bleujs.api_client import BleuAPIClient; print('OK')"
```

Live API calls need `BLEUJS_API_KEY` from https://bleujs.org. Default unit tests do not require it.

### Lint

See `scripts/local-ci.sh` and `.github/workflows/main.yml`. Quick checks:

```bash
poetry run black --check src/bleujs
poetry run ruff check src/bleujs
```

Pre-existing ruff findings across the full `src/` tree are expected; CI focuses on specific paths.

### Tests

Match CI ignores for integration/redis/AWS tests that need external services:

```bash
poetry run pytest tests/ -q \
  --ignore tests/test_api_token_service.py \
  --ignore tests/test_api_token_validation.py \
  --ignore tests/test_api_tokens.py \
  --ignore tests/test_monitoring.py \
  --ignore tests/test_rate_limiting.py \
  --ignore tests/test_services_coverage.py \
  --ignore tests/services/test_redis_client.py \
  --ignore tests/services/test_secrets_manager.py \
  --ignore tests/unit/ai/test_attention.py \
  --ignore tests/unit/aws/test_ec2.py \
  --ignore tests/quantum/test_contest_strategy.py \
  --ignore tests/quantum/test_quantum_circuit.py \
  --ignore tests/middleware/rate_limit_test.py \
  --ignore tests/middleware/auth_test.py \
  --ignore tests/quantum/quantum_processor_test.py \
  --ignore tests/integration/
```

### Gotchas

- Root `docker-compose.yml` references directories not present in this repo; prefer `python main.py` or the root `Dockerfile` for single-container runs.
- `scripts/install.sh` and `scripts/setup.sh` target Node/AWS scaffolding, not local Python dev — use Poetry instead.
- Poetry installs to `~/.local/bin`; ensure it is on `PATH` if `poetry` is not found.
- First `poetry install --extras ci` is slow (PyTorch, TensorFlow, Qiskit). Subsequent runs are incremental.

#!/usr/bin/env bash
# Maintainer reference: pip requirements files map to pyproject.toml extras.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

cat <<'EOF'
Bleu.js dependency installs (canonical source: pyproject.toml)

  Users (PyPI):     pip install bleu-js
  Dev SDK/CLI:      pip install -e .
  Self-host API:    pip install -e ".[server]"
  ML stack:         pip install -e ".[ml]"
  Quantum stack:    pip install -e ".[quantum]"
  Deep learning:    pip install -e ".[deep]"
  CI parity:        pip install -e ".[ci]"
  Full stack:       pip install -e ".[all]"
  Lint/test tools:  pip install -r requirements-dev.txt  (after editable install)

Requirements files (thin wrappers around extras):

  requirements.txt              ->  -e .
  requirements-minimal.txt      ->  -r requirements.txt
  requirements-server-extra.txt ->  -e .[server]
  requirements-ci.txt           ->  -e .[ci]
  requirements-all.txt          ->  -e .[all]
  deploy/requirements-server.txt -> pinned server wheels (Docker)
  requirements-dev.txt          -> dev/lint/test tools (not in package extras)

EOF

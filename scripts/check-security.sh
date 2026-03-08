#!/usr/bin/env bash
# Run local security checks (Python deps + optional Trivy for Bleu OS image).
# For Dependabot/Trivy alerts in the repo, see: GitHub → Security → Dependabot / Code scanning.
set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== Security checks (Bleu.js) ==="
echo ""

# Prefer Poetry env when available (no global install needed)
RUN_PY=""
if command -v poetry >/dev/null 2>&1 && [ -f "$REPO_ROOT/pyproject.toml" ]; then
  RUN_PY="poetry run"
fi

# 1. Python: pip-audit (Poetry, then PATH, then pipx run, then venv)
echo "[1/3] pip-audit (Python dependencies)..."
if [ -n "$RUN_PY" ] && $RUN_PY pip-audit --help >/dev/null 2>&1; then
  $RUN_PY pip-audit 2>/dev/null || $RUN_PY pip-audit --desc 2>/dev/null || true
elif command -v pip-audit >/dev/null 2>&1; then
  pip-audit 2>/dev/null || pip-audit --desc 2>/dev/null || true
elif command -v pipx >/dev/null 2>&1 && pipx run pip-audit --help >/dev/null 2>&1; then
  pipx run pip-audit 2>/dev/null || pipx run pip-audit --desc 2>/dev/null || true
elif python3 -m pip_audit --help >/dev/null 2>&1; then
  python3 -m pip_audit 2>/dev/null || python3 -m pip_audit --desc 2>/dev/null || true
else
  if [ -n "$RUN_PY" ]; then
    echo "  Install in project: poetry run pip install pip-audit   (then run this script again)"
  elif command -v pipx >/dev/null 2>&1; then
    echo "  Install: pipx install pip-audit   (then run this script again)"
  else
    echo "  Install: pipx install pip-audit   (recommended), or: sudo apt install python3-venv && python3 -m venv .venv && . .venv/bin/activate && pip install pip-audit"
  fi
fi
echo ""

# 2. Python: safety (optional)
echo "[2/3] safety (Python vulnerabilities)..."
if [ -n "$RUN_PY" ] && $RUN_PY safety --help >/dev/null 2>&1; then
  $RUN_PY safety scan 2>/dev/null || true
elif command -v safety >/dev/null 2>&1; then
  safety scan 2>/dev/null || true
elif command -v pipx >/dev/null 2>&1 && pipx run safety --help >/dev/null 2>&1; then
  pipx run safety scan 2>/dev/null || true
elif python3 -m safety --help >/dev/null 2>&1; then
  python3 -m safety scan 2>/dev/null || true
else
  if [ -n "$RUN_PY" ]; then
    echo "  Install in project: poetry run pip install safety  (optional)"
  elif command -v pipx >/dev/null 2>&1; then
    echo "  Install: pipx install safety  (optional)"
  else
    echo "  Install: pipx install safety  (optional)"
  fi
fi
echo ""

# 3. Container: Trivy (optional, for Bleu OS image)
echo "[3/3] Trivy (container image; optional)..."
if command -v trivy >/dev/null 2>&1; then
  IMG="ghcr.io/helloblueai/bleu-os:latest"
  if docker image inspect "$IMG" >/dev/null 2>&1; then
    trivy image --severity HIGH,CRITICAL "$IMG" 2>/dev/null || true
  else
    echo "  Image $IMG not found locally. Build with: docker build -f bleu-os/Dockerfile.production -t $IMG ."
  fi
else
  echo "  Install: https://github.com/aquasecurity/trivy#installation  (optional, for image scan)"
fi
echo ""

echo "=== Done ==="
echo "For Dependabot and Trivy alerts: GitHub → Security → Dependabot / Code scanning."
echo "One-page fix checklist and known vulns: see SECURITY.md in the repo root."

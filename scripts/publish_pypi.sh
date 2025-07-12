#!/bin/bash
# Robust PyPI publishing script for Bleu.js
# Uses an isolated environment to avoid dependency conflicts

set -e

# Check for PyPI token
if [ -z "$PYPI_TOKEN" ]; then
    echo "❌ Error: PYPI_TOKEN environment variable not set"
    echo "Please set your PyPI API token:"
    echo "export PYPI_TOKEN='your-token-here'"
    exit 1
fi

WORKDIR=$(mktemp -d)
echo "[Bleu.js] Using temp build dir: $WORKDIR"

python3 -m venv "$WORKDIR/venv"
source "$WORKDIR/venv/bin/activate"
pip install --upgrade pip
pip install build twine readme-renderer docutils>=0.21.2

# Build the package
echo "[Bleu.js] Building package..."
python -m build

# Create twine config with token
mkdir -p "$WORKDIR"
cat > "$WORKDIR/.pypirc" << EOF
[distutils]
index-servers =
    pypi

[pypi]
repository = https://upload.pypi.org/legacy/
username = __token__
password = $PYPI_TOKEN
EOF

# Upload to PyPI (test or prod)
# Usage: ./scripts/publish_pypi.sh [--test]
if [[ "$1" == "--test" ]]; then
  echo "[Bleu.js] Publishing to TestPyPI..."
  twine upload --repository testpypi --config-file "$WORKDIR/.pypirc" dist/*
else
  echo "[Bleu.js] Publishing to PyPI..."
  twine upload --config-file "$WORKDIR/.pypirc" dist/*
fi

deactivate
rm -rf "$WORKDIR"
echo "[Bleu.js] PyPI publish process complete."

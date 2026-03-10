#!/usr/bin/env bash
# Export backend/ for a new repo. Run from Bleu.js repo root. Requires backend/ on disk.
set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_SRC="${REPO_ROOT}/backend"
EXPORT_DIR="${REPO_ROOT}/../Bleu.js-backend-export"

if [ ! -d "$BACKEND_SRC" ]; then
  echo "Error: backend/ not found at $BACKEND_SRC"
  echo "This script exports from your local backend/ (must exist on disk)."
  exit 1
fi

echo "Exporting backend to $EXPORT_DIR ..."
rm -rf "$EXPORT_DIR"
mkdir -p "$EXPORT_DIR"

cp -R "$BACKEND_SRC"/* "$EXPORT_DIR/" 2>/dev/null || true
[ -d "$BACKEND_SRC"/.elasticbeanstalk ] && cp -R "$BACKEND_SRC"/.elasticbeanstalk "$EXPORT_DIR/" 2>/dev/null || true
rm -rf "$EXPORT_DIR/node_modules" "$EXPORT_DIR/.env" "$EXPORT_DIR/.git" 2>/dev/null || true
find "$EXPORT_DIR" -name '*.pkl' -type f -delete 2>/dev/null || true

# Minimal README only for first-time export (do not overwrite existing backend README)
if [ ! -f "$EXPORT_DIR/README.md" ]; then
  cat > "$EXPORT_DIR/README.md" << 'EOF'
# Bleu.js Backend

Node/Express API and services for Bleu.js. Exported from the main [Bleu.js](https://github.com/HelloblueAI/Bleu.js) repo so the product repo stays focused on the Python SDK and CLI.

## Setup

```bash
npm install
cp .env.example .env  # add keys
npm run dev
```

## Deploy

Point your deployment (e.g. bleujs.org API) at this repo. See main repo [docs](https://github.com/HelloblueAI/Bleu.js/tree/main/docs) for architecture.
EOF
fi

# Standard Node .gitignore if missing
if [ ! -f "$EXPORT_DIR/.gitignore" ]; then
  cat > "$EXPORT_DIR/.gitignore" << 'EOF'
node_modules/
.env
.env.*
*.log
.DS_Store
dist/
EOF
fi

echo "Done. Next:"
echo "  cd $EXPORT_DIR"
echo "  git init && git add . && git commit -m 'Initial commit: Bleu.js backend'"
echo "  Create repo HelloblueAI/Bleujs.-backend on GitHub if needed, then:"
echo "  git remote add origin git@github.com:HelloblueAI/Bleujs.-backend.git"
echo "  git branch -M main && git push -u origin main"

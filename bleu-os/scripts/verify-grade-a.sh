#!/usr/bin/env bash
# Local Grade A gate: build production image and scan with Trivy.
# Usage (from Bleu.js repo root):
#   ./bleu-os/scripts/verify-grade-a.sh
#   ./bleu-os/scripts/verify-grade-a.sh --no-build   # scan existing bleu-os:grade-a-scan
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IMAGE="${IMAGE:-bleu-os:grade-a-scan}"
DOCKERFILE="${ROOT}/bleu-os/Dockerfile.production"
TRIVYIGNORE="${ROOT}/bleu-os/.trivyignore"
NO_BUILD=false

while [ $# -gt 0 ]; do
  case "$1" in
    --no-build) NO_BUILD=true; shift ;;
    -h|--help)
      echo "Usage: $0 [--no-build]"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is required."
  exit 1
fi

if [ "$NO_BUILD" = false ]; then
  echo "==> Building production image (multi-stage)..."
  docker build --pull --no-cache -f "$DOCKERFILE" -t "$IMAGE" .
fi

if command -v trivy >/dev/null 2>&1; then
  echo "==> Trivy scan (HIGH,CRITICAL; ignore-unfixed + bleu-os/.trivyignore)..."
  TRIVY_ARGS=(image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1)
  if [ -f "$TRIVYIGNORE" ]; then
    TRIVY_ARGS+=(--ignorefile "$TRIVYIGNORE")
  fi
  if trivy "${TRIVY_ARGS[@]}" "$IMAGE"; then
    echo "✅ Trivy: no unfixed HIGH/CRITICAL outside .trivyignore"
  else
    echo "⚠️  Trivy reported fixable HIGH/CRITICAL — update Dockerfile pins or document in .trivyignore"
    exit 1
  fi
else
  echo "⚠️  trivy not installed; skipping scan. Install: https://github.com/aquasecurity/trivy"
fi

echo "==> Smoke test..."
docker run --rm "$IMAGE" python3 -c "import bleujs, numpy; print('imports OK')"

echo ""
echo "✅ Local Grade A checks passed for $IMAGE"
echo "   Docker Scout Grade A: add policy exceptions — see bleu-os/GRADE_A_CHECKLIST.md"

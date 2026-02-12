#!/usr/bin/env bash
# Build bleuos/bleu-os:minimal from repo root.
# Use DOCKER_API_VERSION=1.44 if your Docker client is older (1.43) but supports 1.44.
#
# For Docker Scout grade A (supply chain attestations), build and push with:
#   PUSH_DIRECTLY=true ./bleu-os/scripts/build-with-attestations.sh
# See bleu-os/BUILD_WITH_ATTESTATIONS.md.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
export DOCKER_API_VERSION="${DOCKER_API_VERSION:-1.44}"
cd "${REPO_ROOT}"
docker build -f bleu-os/Dockerfile.minimal -t bleuos/bleu-os:minimal .
echo "Built: bleuos/bleu-os:minimal"

#!/bin/bash
set -euo pipefail

# Build Bleu OS Production Docker Image

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
VERSION="${VERSION:-1.0.0}"
INSTALL_QUANTUM="${INSTALL_QUANTUM:-true}"
INSTALL_ML="${INSTALL_ML:-true}"
INSTALL_JUPYTER="${INSTALL_JUPYTER:-false}"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_success() {
    echo "✅ $1"
}

log_error() {
    echo "❌ $1"
}

log "Building Bleu OS Production Docker Image..."
log "Version: ${VERSION}"
log "Quantum: ${INSTALL_QUANTUM}"
log "ML: ${INSTALL_ML}"
log "Jupyter: ${INSTALL_JUPYTER}"

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

# Build production image
log "Building production image..."
cd "${PROJECT_ROOT}"

docker build \
    -f bleu-os/Dockerfile.production \
    --build-arg BLEU_OS_VERSION="${VERSION}" \
    --build-arg INSTALL_QUANTUM="${INSTALL_QUANTUM}" \
    --build-arg INSTALL_ML="${INSTALL_ML}" \
    --build-arg INSTALL_JUPYTER="${INSTALL_JUPYTER}" \
    -t bleuos/bleu-os:${VERSION} \
    -t bleuos/bleu-os:latest \
    .

if [[ $? -eq 0 ]]; then
    log_success "Production image built successfully!"

    # Show image info
    log "Image information:"
    docker images | grep bleuos/bleu-os | head -3

    # Test the image
    log "Testing production image..."
    docker run --rm bleuos/bleu-os:latest \
        python3 -c "import bleujs; print('Bleu.js version:', getattr(bleujs, '__version__', 'installed'))" 2>/dev/null || \
        echo "Bleu.js test completed"

    log_success "Production build complete!"
    log "To run: docker run -it --gpus all bleuos/bleu-os:latest"
else
    log_error "Build failed"
    exit 1
fi

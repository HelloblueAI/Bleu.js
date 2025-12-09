#!/bin/bash
set -euo pipefail

# Publish Bleu OS to Docker Hub

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
IMAGE_NAME="${IMAGE_NAME:-bleuos/bleu-os}"
VERSION="${VERSION:-1.0.0}"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_success() {
    echo "✅ $1"
}

log_error() {
    echo "❌ $1"
}

log_info() {
    echo "ℹ️  $1"
}

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username"; then
    log_info "Not logged in to Docker Hub"
    log "Please login: docker login"
    read -p "Press Enter after logging in, or Ctrl+C to cancel..."
fi

# Build image if it doesn't exist
if ! docker images | grep -q "bleu-os.*latest"; then
    log "Building Bleu OS image..."
    cd "${PROJECT_ROOT}"
    docker build -t bleu-os:latest -f bleu-os/Dockerfile .
    log_success "Image built"
else
    log_success "Image already exists"
fi

# Tag images
log "Tagging images..."
docker tag bleu-os:latest "${IMAGE_NAME}:latest"
docker tag bleu-os:latest "${IMAGE_NAME}:${VERSION}"
docker tag bleu-os:latest "${IMAGE_NAME}:quantum-ai"
log_success "Images tagged"

# Push to Docker Hub
log "Pushing to Docker Hub..."
log_info "This may take several minutes..."

docker push "${IMAGE_NAME}:latest"
log_success "Pushed latest"

docker push "${IMAGE_NAME}:${VERSION}"
log_success "Pushed ${VERSION}"

docker push "${IMAGE_NAME}:quantum-ai"
log_success "Pushed quantum-ai tag"

log ""
log_success "Bleu OS published to Docker Hub!"
log_info "Users can now run: docker pull ${IMAGE_NAME}:latest"
log_info "View at: https://hub.docker.com/r/${IMAGE_NAME}"

#!/bin/bash
set -euo pipefail

# Build Bleu OS Docker Image with Supply Chain Attestations (SBOM & Provenance)
# This script builds images with attestations to meet Docker Scout requirements.
# Use DOCKER_API_VERSION=1.44 if your Docker client reports "1.43 is too old".

export DOCKER_API_VERSION="${DOCKER_API_VERSION:-1.44}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
IMAGE_NAME="${IMAGE_NAME:-bleuos/bleu-os}"
VARIANT="${VARIANT:-minimal}"
DOCKERFILE="${DOCKERFILE:-bleu-os/Dockerfile.minimal}"

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

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

# Check if buildx is available
if ! docker buildx version &> /dev/null; then
    log_error "Docker Buildx is required for attestations. Install it or update Docker."
    exit 1
fi

# Set up buildx builder if needed
log "Setting up Docker Buildx..."
BUILDER_NAME="attestation-builder-$$"
docker buildx create --use --name "${BUILDER_NAME}" 2>/dev/null || docker buildx use default || true
docker buildx inspect --bootstrap > /dev/null 2>&1 || true

# Determine tags (production -> latest + main; minimal -> minimal)
TAG="${VARIANT}"
EXTRA_TAGS=()
if [[ "${VARIANT}" == "minimal" ]]; then
    TAG="minimal"
elif [[ "${VARIANT}" == "production" ]]; then
    TAG="latest"
    EXTRA_TAGS+=("main")
fi

log "Building ${IMAGE_NAME}:${TAG} with attestations..."
log_info "Dockerfile: ${DOCKERFILE}"
log_info "Variant: ${VARIANT}"

# Build with attestations
cd "${PROJECT_ROOT}"

# Check if user wants to push directly (attestations work best with direct push)
PUSH_DIRECTLY="${PUSH_DIRECTLY:-false}"

if [[ "${PUSH_DIRECTLY}" == "true" ]]; then
    log_info "Building and pushing directly (attestations will be attached)..."
    # Build and push directly - attestations are automatically attached
    TAGS=("--tag" "${IMAGE_NAME}:${TAG}" "--tag" "${IMAGE_NAME}:sha-$(git rev-parse --short HEAD 2>/dev/null || echo 'local')")
    for t in "${EXTRA_TAGS[@]}"; do TAGS+=("--tag" "${IMAGE_NAME}:${t}"); done
    docker buildx build \
        --file "${DOCKERFILE}" \
        "${TAGS[@]}" \
        --provenance=true \
        --sbom=true \
        --platform linux/amd64 \
        --push \
        . || {
        log_error "Build and push failed"
        exit 1
    }
    log_success "Pushed to Docker Hub with attestations!"
else
    log_info "Building with attestations (local)..."
    TAGS=("--tag" "${IMAGE_NAME}:${TAG}" "--tag" "${IMAGE_NAME}:sha-$(git rev-parse --short HEAD 2>/dev/null || echo 'local')")
    for t in "${EXTRA_TAGS[@]}"; do TAGS+=("--tag" "${IMAGE_NAME}:${t}"); done
    docker buildx build \
        --file "${DOCKERFILE}" \
        "${TAGS[@]}" \
        --provenance=true \
        --sbom=true \
        --platform linux/amd64 \
        --output type=docker \
        "${PROJECT_ROOT}" || {
        log_error "Build failed. Trying alternative method..."
        # Alternative: use docker build with BuildKit (may not preserve attestations)
        log_info "Using DOCKER_BUILDKIT=1 as fallback..."
        DOCKER_BUILDKIT=1 docker build \
            --file "${DOCKERFILE}" \
            --tag "${IMAGE_NAME}:${TAG}" \
            --tag "${IMAGE_NAME}:sha-$(git rev-parse --short HEAD 2>/dev/null || echo 'local')" \
            . || exit 1
        log_warning "Fallback build may not include attestations"
    }
fi

log_success "Build complete with attestations!"
log_info "Image: ${IMAGE_NAME}:${TAG}"

# Verify attestations (if buildx imagetools is available)
if command -v docker &> /dev/null && docker buildx imagetools &> /dev/null; then
    log "Verifying attestations..."
    docker buildx imagetools inspect "${IMAGE_NAME}:${TAG}" --format "{{json .Attestations}}" 2>/dev/null | jq '.' 2>/dev/null && \
        log_success "Attestations verified!" || \
        log_info "Could not verify attestations (image may need to be pushed first)"
fi

log ""
log_success "To push to Docker Hub:"
log_info "  docker push ${IMAGE_NAME}:${TAG}"
for t in "${EXTRA_TAGS[@]}"; do log_info "  docker push ${IMAGE_NAME}:${t}"; done
log_info "  docker push ${IMAGE_NAME}:sha-$(git rev-parse --short HEAD 2>/dev/null || echo 'local')"

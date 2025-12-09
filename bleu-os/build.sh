#!/bin/bash
set -euo pipefail

# Bleu OS Build Script
# Builds a specialized Linux distribution optimized for quantum/AI workloads

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${BUILD_DIR:-${SCRIPT_DIR}/build}"
ARCH="${ARCH:-x86_64}"
VARIANT="${VARIANT:-quantum-ai}"
VERSION="${VERSION:-1.0.0}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --arch)
            ARCH="$2"
            shift 2
            ;;
        --variant)
            VARIANT="$2"
            shift 2
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --arch ARCH       Target architecture (x86_64, arm64)"
            echo "  --variant VAR     Build variant (quantum-ai, minimal, full)"
            echo "  --version VER     OS version"
            echo "  --clean           Clean build directory"
            echo "  --help            Show this help"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Clean build directory if requested
if [[ "${CLEAN:-false}" == "true" ]]; then
    log "Cleaning build directory..."
    rm -rf "${BUILD_DIR}"
fi

# Create build directory
mkdir -p "${BUILD_DIR}"/{rootfs,iso,kernel,packages}

log "Building Bleu OS ${VERSION}"
log "Architecture: ${ARCH}"
log "Variant: ${VARIANT}"
log "Build directory: ${BUILD_DIR}"

# Check dependencies
log "Checking build dependencies..."
MISSING_DEPS=()
for dep in docker debootstrap qemu-debootstrap; do
    if ! command -v "$dep" &> /dev/null; then
        MISSING_DEPS+=("$dep")
    fi
done

if [[ ${#MISSING_DEPS[@]} -gt 0 ]]; then
    log_error "Missing dependencies: ${MISSING_DEPS[*]}"
    log "Install with: sudo apt-get install ${MISSING_DEPS[*]}"
    exit 1
fi

log_success "All dependencies found"

# Build root filesystem
log "Building root filesystem..."
"${SCRIPT_DIR}/scripts/build-rootfs.sh" \
    --arch "${ARCH}" \
    --variant "${VARIANT}" \
    --output "${BUILD_DIR}/rootfs" \
    --version "${VERSION}"

# Build kernel
log "Building optimized kernel..."
"${SCRIPT_DIR}/scripts/build-kernel.sh" \
    --arch "${ARCH}" \
    --config "${SCRIPT_DIR}/config/kernel.config" \
    --output "${BUILD_DIR}/kernel"

# Install packages
log "Installing packages..."
"${SCRIPT_DIR}/scripts/install-packages.sh" \
    --rootfs "${BUILD_DIR}/rootfs" \
    --variant "${VARIANT}" \
    --packages "${SCRIPT_DIR}/config/packages.list"

# Configure system
log "Configuring system..."
"${SCRIPT_DIR}/scripts/configure-system.sh" \
    --rootfs "${BUILD_DIR}/rootfs" \
    --variant "${VARIANT}"

# Install Bleu.js
log "Installing Bleu.js..."
"${SCRIPT_DIR}/scripts/install-bleujs.sh" \
    --rootfs "${BUILD_DIR}/rootfs"

# Apply optimizations
log "Applying Bleu OS optimizations..."
"${SCRIPT_DIR}/scripts/apply-optimizations.sh" \
    --rootfs "${BUILD_DIR}/rootfs" \
    --config "${SCRIPT_DIR}/config/bleu-optimizations.conf"

# Create ISO
log "Creating ISO image..."
"${SCRIPT_DIR}/scripts/create-iso.sh" \
    --rootfs "${BUILD_DIR}/rootfs" \
    --kernel "${BUILD_DIR}/kernel" \
    --output "${BUILD_DIR}/iso/bleu-os-${VERSION}-${ARCH}-${VARIANT}.iso"

log_success "Bleu OS build complete!"
log "ISO image: ${BUILD_DIR}/iso/bleu-os-${VERSION}-${ARCH}-${VARIANT}.iso"
log "Root filesystem: ${BUILD_DIR}/rootfs"

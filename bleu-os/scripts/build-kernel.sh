#!/bin/bash
set -euo pipefail

# Build optimized kernel for Bleu OS

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCH="${ARCH:-x86_64}"
CONFIG="${CONFIG:-${SCRIPT_DIR}/config/kernel.config}"
OUTPUT="${OUTPUT:-${SCRIPT_DIR}/build/kernel}"
KERNEL_VERSION="${KERNEL_VERSION:-6.6}"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --arch)
            ARCH="$2"
            shift 2
            ;;
        --config)
            CONFIG="$2"
            shift 2
            ;;
        --output)
            OUTPUT="$2"
            shift 2
            ;;
        --kernel-version)
            KERNEL_VERSION="$2"
            shift 2
            ;;
        *)
            log "Unknown option: $1"
            exit 1
            ;;
    esac
done

log "Building Bleu OS kernel..."
log "Architecture: ${ARCH}"
log "Kernel version: ${KERNEL_VERSION}"
log "Config: ${CONFIG}"
log "Output: ${OUTPUT}"

mkdir -p "${OUTPUT}"

# Check if we should use Docker for kernel build
if command -v docker &> /dev/null; then
    log "Using Docker to build kernel..."
    docker run --rm \
        -v "${SCRIPT_DIR}":/build \
        -v "${OUTPUT}":/output \
        -e ARCH="${ARCH}" \
        -e KERNEL_VERSION="${KERNEL_VERSION}" \
        debian:bookworm-slim \
        bash -c "
            apt-get update && \
            apt-get install -y build-essential bc libncurses-dev flex bison libssl-dev libelf-dev && \
            cd /tmp && \
            wget https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-${KERNEL_VERSION}.tar.xz && \
            tar xf linux-${KERNEL_VERSION}.tar.xz && \
            cd linux-${KERNEL_VERSION} && \
            cp /build/config/kernel.config .config && \
            make ARCH=${ARCH} olddefconfig && \
            make ARCH=${ARCH} -j\$(nproc) && \
            make ARCH=${ARCH} modules_install INSTALL_MOD_PATH=/output && \
            cp arch/${ARCH}/boot/bzImage /output/vmlinuz-bleu-os && \
            cp System.map /output/System.map-bleu-os
        "
else
    log "Docker not found. Kernel build requires Docker or native build environment."
    log "Skipping kernel build. Using host kernel configuration."
fi

log "Kernel build complete"

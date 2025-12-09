#!/bin/bash
set -euo pipefail

# Build root filesystem for Bleu OS

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCH="${ARCH:-x86_64}"
VARIANT="${VARIANT:-quantum-ai}"
OUTPUT="${OUTPUT:-${SCRIPT_DIR}/build/rootfs}"
VERSION="${VERSION:-1.0.0}"

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
        --variant)
            VARIANT="$2"
            shift 2
            ;;
        --output)
            OUTPUT="$2"
            shift 2
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        *)
            log "Unknown option: $1"
            exit 1
            ;;
    esac
done

log "Building root filesystem..."
log "Architecture: ${ARCH}"
log "Variant: ${VARIANT}"
log "Output: ${OUTPUT}"

# Create output directory
mkdir -p "${OUTPUT}"

# Determine base distribution
case "${ARCH}" in
    x86_64|amd64)
        DEBIAN_ARCH=amd64
        ;;
    arm64|aarch64)
        DEBIAN_ARCH=arm64
        ;;
    *)
        log "Unsupported architecture: ${ARCH}"
        exit 1
        ;;
esac

# Build rootfs using debootstrap
if command -v debootstrap &> /dev/null; then
    log "Using debootstrap to create base system..."
    debootstrap \
        --arch="${DEBIAN_ARCH}" \
        --variant=minbase \
        --include=systemd,systemd-sysv,bash,curl,wget,git \
        bookworm \
        "${OUTPUT}" \
        http://deb.debian.org/debian
else
    log "debootstrap not found, using Docker to build rootfs..."
    docker run --rm \
        -v "${OUTPUT}":/output \
        -v "${SCRIPT_DIR}":/build \
        debian:bookworm-slim \
        bash -c "
            apt-get update && \
            apt-get install -y debootstrap && \
            debootstrap --arch=${DEBIAN_ARCH} --variant=minbase \
                --include=systemd,systemd-sysv,bash,curl,wget,git \
                bookworm /output http://deb.debian.org/debian
        "
fi

log "Root filesystem created successfully"

#!/bin/bash
set -euo pipefail

# Install packages into root filesystem

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOTFS="${ROOTFS:-${SCRIPT_DIR}/build/rootfs}"
VARIANT="${VARIANT:-quantum-ai}"
PACKAGES_FILE="${PACKAGES_FILE:-${SCRIPT_DIR}/config/packages.list}"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --rootfs)
            ROOTFS="$2"
            shift 2
            ;;
        --variant)
            VARIANT="$2"
            shift 2
            ;;
        --packages)
            PACKAGES_FILE="$2"
            shift 2
            ;;
        *)
            log "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [[ ! -d "${ROOTFS}" ]]; then
    log "Error: Root filesystem not found: ${ROOTFS}"
    exit 1
fi

if [[ ! -f "${PACKAGES_FILE}" ]]; then
    log "Warning: Packages file not found: ${PACKAGES_FILE}"
    exit 1
fi

log "Installing packages into ${ROOTFS}..."
log "Variant: ${VARIANT}"
log "Packages file: ${PACKAGES_FILE}"

# Read packages from file (skip comments and empty lines)
PACKAGES=()
while IFS= read -r line; do
    # Skip comments and empty lines
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    PACKAGES+=("$line")
done < "${PACKAGES_FILE}"

log "Found ${#PACKAGES[@]} packages to install"

# Install packages using chroot
if command -v chroot &> /dev/null; then
    log "Installing packages via chroot..."
    chroot "${ROOTFS}" /bin/bash -c "
        export DEBIAN_FRONTEND=noninteractive
        apt-get update
        apt-get install -y ${PACKAGES[*]}
        apt-get clean
        rm -rf /var/lib/apt/lists/*
    " || log "Warning: Some packages may have failed to install"
else
    log "Warning: chroot not available. Package installation skipped."
    log "Packages to install: ${PACKAGES[*]}"
fi

log "Package installation complete"

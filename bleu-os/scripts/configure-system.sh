#!/bin/bash
set -euo pipefail

# Configure system settings

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOTFS="${ROOTFS:-${SCRIPT_DIR}/build/rootfs}"
VARIANT="${VARIANT:-quantum-ai}"

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

log "Configuring system..."
log "Root filesystem: ${ROOTFS}"
log "Variant: ${VARIANT}"

# Create OS release file
log "Creating OS release file..."
mkdir -p "${ROOTFS}/etc"
cat > "${ROOTFS}/etc/bleu-os-release" << EOF
NAME="Bleu OS"
VERSION="1.0.0"
ID=bleuos
ID_LIKE=debian
PRETTY_NAME="Bleu OS 1.0.0"
VERSION_ID="1.0.0"
HOME_URL="https://github.com/HelloblueAI/Bleu.js"
SUPPORT_URL="https://github.com/HelloblueAI/Bleu.js/issues"
BUG_REPORT_URL="https://github.com/HelloblueAI/Bleu.js/issues"
EOF

# Create hostname
echo "bleu-os" > "${ROOTFS}/etc/hostname"

# Configure network
log "Configuring network..."
mkdir -p "${ROOTFS}/etc/network"
cat > "${ROOTFS}/etc/network/interfaces" << 'EOF'
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet dhcp
EOF

# Configure timezone
log "Configuring timezone..."
mkdir -p "${ROOTFS}/etc"
echo "UTC" > "${ROOTFS}/etc/timezone"

# Create directories
log "Creating system directories..."
mkdir -p "${ROOTFS}"/{opt/bleu-js,var/log,var/cache,run,tmp}
chmod 1777 "${ROOTFS}/tmp"

# Configure systemd
log "Configuring systemd..."
mkdir -p "${ROOTFS}/etc/systemd/system"
mkdir -p "${ROOTFS}/etc/systemd/system/multi-user.target.wants"

# Enable essential services
SERVICES=("systemd-networkd" "systemd-resolved")
for service in "${SERVICES[@]}"; do
    if [[ -f "${ROOTFS}/lib/systemd/system/${service}.service" ]]; then
        ln -sf "/lib/systemd/system/${service}.service" \
            "${ROOTFS}/etc/systemd/system/multi-user.target.wants/${service}.service" || true
    fi
done

log "System configuration complete"

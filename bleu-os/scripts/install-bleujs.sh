#!/bin/bash
set -euo pipefail

# Install Bleu.js into Bleu OS root filesystem

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOTFS="${ROOTFS:-${SCRIPT_DIR}/build/rootfs}"

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

log "Installing Bleu.js into ${ROOTFS}..."

# Copy Bleu.js source
BLEU_SRC="${SCRIPT_DIR}/../src/bleujs"
BLEU_DEST="${ROOTFS}/opt/bleu-js"

if [[ -d "${BLEU_SRC}" ]]; then
    log "Copying Bleu.js source..."
    mkdir -p "${BLEU_DEST}"
    cp -r "${BLEU_SRC}" "${BLEU_DEST}/src/"

    # Copy requirements
    if [[ -f "${SCRIPT_DIR}/../requirements.txt" ]]; then
        cp "${SCRIPT_DIR}/../requirements.txt" "${BLEU_DEST}/"
    fi

    # Install Bleu.js
    log "Installing Bleu.js Python package..."
    chroot "${ROOTFS}" /bin/bash -c "
        cd /opt/bleu-js && \
        pip3 install -e . --no-cache-dir
    " || log "Warning: Bleu.js installation may have failed"
else
    log "Warning: Bleu.js source not found at ${BLEU_SRC}"
fi

# Create systemd service
log "Creating Bleu.js systemd service..."
mkdir -p "${ROOTFS}/etc/systemd/system"
cat > "${ROOTFS}/etc/systemd/system/bleujs.service" << 'EOF'
[Unit]
Description=Bleu.js Quantum-Enhanced AI Service
After=network.target

[Service]
Type=simple
User=bleujs
WorkingDirectory=/opt/bleu-js
ExecStart=/usr/bin/python3 -m bleujs.cli serve
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create bleujs user
log "Creating bleujs user..."
chroot "${ROOTFS}" /bin/bash -c "
    useradd -r -s /bin/bash -d /opt/bleu-js bleujs || true
"

log "Bleu.js installation complete"

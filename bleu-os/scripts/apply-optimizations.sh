#!/bin/bash
set -euo pipefail

# Apply Bleu OS optimizations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOTFS="${ROOTFS:-${SCRIPT_DIR}/build/rootfs}"
CONFIG="${CONFIG:-${SCRIPT_DIR}/config/bleu-optimizations.conf}"

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
        --config)
            CONFIG="$2"
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

if [[ ! -f "${CONFIG}" ]]; then
    log "Warning: Configuration file not found: ${CONFIG}"
    exit 1
fi

log "Applying Bleu OS optimizations..."
log "Root filesystem: ${ROOTFS}"
log "Config: ${CONFIG}"

# Copy configuration
mkdir -p "${ROOTFS}/etc/bleu-os"
cp "${CONFIG}" "${ROOTFS}/etc/bleu-os/bleu-optimizations.conf"

# Create systemd service for applying optimizations at boot
log "Creating optimization service..."
mkdir -p "${ROOTFS}/etc/systemd/system"
cat > "${ROOTFS}/etc/systemd/system/bleu-optimizations.service" << 'EOF'
[Unit]
Description=Apply Bleu OS Optimizations
After=multi-user.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/apply-bleu-optimizations.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

# Create optimization script
cat > "${ROOTFS}/usr/local/bin/apply-bleu-optimizations.sh" << 'EOF'
#!/bin/bash
# Apply Bleu OS optimizations at boot

CONFIG="/etc/bleu-os/bleu-optimizations.conf"

if [[ ! -f "$CONFIG" ]]; then
    # Source configuration
    source <(grep -v '^#' "$CONFIG" | grep -v '^$' | sed 's/\[\(.*\)\]/\1/g')

    # Apply CPU governor
    if [[ -n "${cpu_governor:-}" ]]; then
        for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
            if [[ -f "$cpu" ]]; then
                echo "${cpu_governor}" > "$cpu" 2>/dev/null || true
            fi
        done
    fi

    # Apply memory settings
    if [[ -n "${vm_swappiness:-}" ]]; then
        sysctl -w vm.swappiness="${vm_swappiness}" >/dev/null 2>&1 || true
    fi
fi
EOF

chmod +x "${ROOTFS}/usr/local/bin/apply-bleu-optimizations.sh"

# Enable service
ln -sf "/etc/systemd/system/bleu-optimizations.service" \
    "${ROOTFS}/etc/systemd/system/multi-user.target.wants/bleu-optimizations.service" || true

log "Optimizations applied"

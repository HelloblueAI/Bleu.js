#!/bin/bash
set -euo pipefail

# Create ISO image from root filesystem

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOTFS="${ROOTFS:-${SCRIPT_DIR}/build/rootfs}"
KERNEL="${KERNEL:-${SCRIPT_DIR}/build/kernel}"
OUTPUT="${OUTPUT:-${SCRIPT_DIR}/build/iso/bleu-os.iso}"

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
        --kernel)
            KERNEL="$2"
            shift 2
            ;;
        --output)
            OUTPUT="$2"
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

log "Creating ISO image..."
log "Root filesystem: ${ROOTFS}"
log "Output: ${OUTPUT}"

mkdir -p "$(dirname "${OUTPUT}")"
ISO_TMP="${SCRIPT_DIR}/build/iso-tmp"
mkdir -p "${ISO_TMP}"

# Copy rootfs to ISO structure
log "Preparing ISO structure..."
cp -a "${ROOTFS}"/* "${ISO_TMP}/" 2>/dev/null || true

# Create boot structure
mkdir -p "${ISO_TMP}/boot/grub"
if [[ -f "${KERNEL}/vmlinuz-bleu-os" ]]; then
    cp "${KERNEL}/vmlinuz-bleu-os" "${ISO_TMP}/boot/vmlinuz"
fi

# Create GRUB configuration
cat > "${ISO_TMP}/boot/grub/grub.cfg" << 'EOF'
set default=0
set timeout=5

menuentry "Bleu OS" {
    linux /boot/vmlinuz root=/dev/sda1 quiet
    initrd /boot/initrd.img
}

menuentry "Bleu OS (Safe Mode)" {
    linux /boot/vmlinuz root=/dev/sda1 quiet single
    initrd /boot/initrd.img
}
EOF

# Create ISO using genisoimage or mkisofs
if command -v genisoimage &> /dev/null; then
    log "Creating ISO with genisoimage..."
    genisoimage -R -J -T -V "Bleu OS" \
        -b boot/grub/stage2_eltorito \
        -no-emul-boot -boot-load-size 4 -boot-info-table \
        -o "${OUTPUT}" "${ISO_TMP}"
elif command -v mkisofs &> /dev/null; then
    log "Creating ISO with mkisofs..."
    mkisofs -R -J -T -V "Bleu OS" \
        -b boot/grub/stage2_eltorito \
        -no-emul-boot -boot-load-size 4 -boot-info-table \
        -o "${OUTPUT}" "${ISO_TMP}"
else
    log "Warning: genisoimage or mkisofs not found. ISO creation skipped."
    log "Install with: sudo apt-get install genisoimage"
fi

# Cleanup
rm -rf "${ISO_TMP}"

if [[ -f "${OUTPUT}" ]]; then
    log "ISO image created: ${OUTPUT}"
    ls -lh "${OUTPUT}"
else
    log "Warning: ISO image creation may have failed"
fi

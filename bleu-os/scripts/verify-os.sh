#!/bin/bash
set -euo pipefail

# Bleu OS Verification Script
# Verifies that Bleu OS is properly installed and configured

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ERRORS=0
WARNINGS=0

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_success() {
    echo "✅ $1"
}

log_error() {
    echo "❌ $1"
    ((ERRORS++))
}

log_warning() {
    echo "⚠️  $1"
    ((WARNINGS++))
}

log "Starting Bleu OS verification..."

# Check OS release
if [[ -f /etc/bleu-os-release ]]; then
    log_success "Bleu OS release file found"
    cat /etc/bleu-os-release
else
    log_warning "Bleu OS release file not found (may be running in container)"
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    log_success "Python found: $PYTHON_VERSION"
else
    log_error "Python3 not found"
fi

# Check Bleu.js
if python3 -c "import bleujs" 2>/dev/null; then
    BLEU_VERSION=$(python3 -c "import bleujs; print(getattr(bleujs, '__version__', 'unknown'))" 2>/dev/null || echo "installed")
    log_success "Bleu.js found (version: $BLEU_VERSION)"

    # Test Bleu.js import
    if python3 -c "from bleujs import BleuJS" 2>/dev/null; then
        log_success "BleuJS class importable"
    else
        log_warning "BleuJS class not importable"
    fi
else
    log_warning "Bleu.js not found (may need installation)"
fi

# Check quantum libraries
QUANTUM_LIBS=("qiskit" "cirq" "pennylane")
for lib in "${QUANTUM_LIBS[@]}"; do
    if python3 -c "import $lib" 2>/dev/null; then
        VERSION=$(python3 -c "import $lib; print(getattr($lib, '__version__', 'unknown'))" 2>/dev/null || echo "installed")
        log_success "$lib found (version: $VERSION)"
    else
        log_warning "$lib not found"
    fi
done

# Check ML libraries
ML_LIBS=("torch" "tensorflow" "xgboost" "sklearn")
for lib in "${ML_LIBS[@]}"; do
    if python3 -c "import $lib" 2>/dev/null; then
        VERSION=$(python3 -c "import $lib; print(getattr($lib, '__version__', 'unknown'))" 2>/dev/null || echo "installed")
        log_success "$lib found (version: $VERSION)"
    else
        log_warning "$lib not found"
    fi
done

# Check GPU support
if command -v nvidia-smi &> /dev/null; then
    GPU_INFO=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
    log_success "NVIDIA GPU detected: $GPU_INFO"
elif [[ -d /dev/dri ]]; then
    log_success "AMD/Intel GPU detected"
else
    log_warning "No GPU detected (CPU-only mode)"
fi

# Check system optimizations
if [[ -f /etc/bleu-os/bleu-optimizations.conf ]]; then
    log_success "Bleu OS optimizations configuration found"
else
    log_warning "Optimizations configuration not found"
fi

# Check CPU governor
if [[ -f /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor ]]; then
    GOVERNOR=$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor)
    if [[ "$GOVERNOR" == "performance" ]]; then
        log_success "CPU governor set to performance mode"
    else
        log_warning "CPU governor: $GOVERNOR (consider setting to performance)"
    fi
fi

# Check memory
if command -v free &> /dev/null; then
    MEM_TOTAL=$(free -h | awk '/^Mem:/ {print $2}')
    log_success "Total memory: $MEM_TOTAL"
fi

# Check network
if command -v ip &> /dev/null; then
    if ip link show | grep -q "state UP"; then
        log_success "Network interface is up"
    else
        log_warning "No active network interfaces"
    fi
fi

# Summary
echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"

if [[ $ERRORS -eq 0 ]]; then
    log_success "Bleu OS verification passed!"
    exit 0
else
    log_error "Bleu OS verification found $ERRORS error(s)"
    exit 1
fi

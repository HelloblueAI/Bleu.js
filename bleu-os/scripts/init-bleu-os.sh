#!/bin/bash
# Bleu OS Initialization Script
# Runs on container/system startup

set -euo pipefail

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [Bleu OS] $1"
}

# Load configuration
if [[ -f /etc/bleu-os/bleu-optimizations.conf ]]; then
    log "Loading Bleu OS configuration..."
    # Parse INI-style config, only processing key=value lines
    while IFS= read -r line; do
        # Skip empty lines, comments, and section headers
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# || "$line" =~ ^[[:space:]]*\[ ]] && continue
        # Only process lines with = sign
        if [[ "$line" =~ = ]]; then
            IFS='=' read -r key value <<< "$line"
            # Remove leading/trailing whitespace
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | xargs)
            # Export as environment variable (skip if empty or invalid)
            if [[ -n "$key" && "$key" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
                export "${key}=${value}" 2>/dev/null || true
            fi
        fi
    done < /etc/bleu-os/bleu-optimizations.conf
fi

# Apply system optimizations
log "Applying system optimizations..."

# CPU Governor
if [[ -n "${cpu_governor:-}" ]]; then
    for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
        if [[ -f "$cpu" ]]; then
            echo "${cpu_governor}" > "$cpu" 2>/dev/null || true
        fi
    done
fi

# Memory settings
if [[ -n "${vm_swappiness:-}" ]]; then
    sysctl -w vm.swappiness="${vm_swappiness}" >/dev/null 2>&1 || true
fi

# Network optimizations
if command -v sysctl &> /dev/null; then
    sysctl -w net.core.rmem_max=134217728 >/dev/null 2>&1 || true
    sysctl -w net.core.wmem_max=134217728 >/dev/null 2>&1 || true
fi

# Initialize Bleu.js
if command -v python3 &> /dev/null && python3 -c "import bleujs" 2>/dev/null; then
    log "Bleu.js detected and ready"
    export BLEU_QUANTUM_MODE="${BLEU_QUANTUM_MODE:-true}"
    export BLEU_OPTIMIZATION_LEVEL="${BLEU_OPTIMIZATION_LEVEL:-3}"
else
    log "Warning: Bleu.js not found"
fi

# Check for GPU
if command -v nvidia-smi &> /dev/null; then
    log "NVIDIA GPU detected"
    nvidia-smi --query-gpu=name --format=csv,noheader | head -1
elif [[ -d /dev/dri ]]; then
    log "AMD/Intel GPU detected"
fi

# Check for quantum hardware
if [[ -n "${ibm_quantum_enabled:-}" ]] && [[ "${ibm_quantum_enabled}" == "true" ]]; then
    log "IBM Quantum support enabled"
fi

log "Bleu OS initialization complete"

# Execute command if provided
if [[ $# -gt 0 ]]; then
    exec "$@"
fi

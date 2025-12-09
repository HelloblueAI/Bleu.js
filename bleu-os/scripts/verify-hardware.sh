#!/bin/bash
set -euo pipefail

# Verify Hardware Support in Bleu OS

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DETECTED_HARDWARE=()
MISSING_HARDWARE=()

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_success() {
    echo "✅ $1"
    DETECTED_HARDWARE+=("$1")
}

log_warning() {
    echo "⚠️  $1"
    MISSING_HARDWARE+=("$1")
}

log_error() {
    echo "❌ $1"
    MISSING_HARDWARE+=("$1")
}

log "Checking hardware support in Bleu OS..."
echo "=========================================="

# Check CPU
log "Checking CPU..."
if command -v lscpu &> /dev/null; then
    CPU_MODEL=$(lscpu | grep "Model name" | cut -d: -f2 | xargs)
    CPU_CORES=$(lscpu | grep "^CPU(s):" | awk '{print $2}')
    log_success "CPU: $CPU_MODEL ($CPU_CORES cores)"
else
    log_warning "CPU info not available"
fi

# Check Memory
log "Checking Memory..."
if command -v free &> /dev/null; then
    MEM_TOTAL=$(free -h | awk '/^Mem:/ {print $2}')
    log_success "Memory: $MEM_TOTAL"
else
    log_warning "Memory info not available"
fi

# Check NVIDIA GPU
log "Checking NVIDIA GPU..."
if command -v nvidia-smi &> /dev/null; then
    if nvidia-smi &> /dev/null; then
        GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
        GPU_COUNT=$(nvidia-smi --list-gpus | wc -l)
        CUDA_VERSION=$(nvidia-smi --query-gpu=cuda_version --format=csv,noheader | head -1)
        log_success "NVIDIA GPU: $GPU_NAME (CUDA $CUDA_VERSION) - $GPU_COUNT GPU(s)"

        # Check PyTorch CUDA
        if python3 -c "import torch; print(torch.cuda.is_available())" 2>/dev/null | grep -q "True"; then
            log_success "PyTorch CUDA support: Enabled"
        else
            log_warning "PyTorch CUDA support: Not available"
        fi
    else
        log_warning "NVIDIA GPU: Drivers not working"
    fi
else
    log_warning "NVIDIA GPU: Not detected (nvidia-smi not found)"
fi

# Check AMD GPU
log "Checking AMD GPU..."
if command -v rocminfo &> /dev/null; then
    if rocminfo &> /dev/null; then
        AMD_GPU=$(rocminfo | grep "Marketing Name" | head -1 | cut -d: -f2 | xargs || echo "AMD GPU")
        log_success "AMD GPU: $AMD_GPU"
    else
        log_warning "AMD GPU: ROCm not working"
    fi
elif lspci | grep -qi "amd\|ati\|radeon"; then
    log_warning "AMD GPU: Detected but ROCm not installed"
else
    log_warning "AMD GPU: Not detected"
fi

# Check Intel GPU
log "Checking Intel GPU..."
if lspci | grep -qi "intel.*vga\|intel.*display"; then
    INTEL_GPU=$(lspci | grep -i "intel.*vga\|intel.*display" | head -1)
    log_success "Intel GPU: Detected"
    if command -v intel_gpu_top &> /dev/null; then
        log_success "Intel GPU tools: Installed"
    else
        log_warning "Intel GPU tools: Not installed"
    fi
else
    log_warning "Intel GPU: Not detected"
fi

# Check Storage (NVMe)
log "Checking Storage..."
if lsblk | grep -q nvme; then
    NVME_COUNT=$(lsblk | grep nvme | wc -l)
    log_success "NVMe SSD: $NVME_COUNT device(s) detected"
else
    log_warning "NVMe SSD: Not detected"
fi

# Check Network
log "Checking Network..."
if command -v ip &> /dev/null; then
    NETWORK_SPEED=$(ethtool $(ip link show | grep -E "^[0-9]+:" | head -1 | cut -d: -f2 | xargs) 2>/dev/null | grep Speed | cut -d: -f2 | xargs || echo "unknown")
    if [[ "$NETWORK_SPEED" == *"10000"* ]] || [[ "$NETWORK_SPEED" == *"100000"* ]]; then
        log_success "Network: High-speed ($NETWORK_SPEED)"
    else
        log_success "Network: $NETWORK_SPEED"
    fi
fi

# Check Quantum Hardware Access
log "Checking Quantum Hardware Access..."

# IBM Quantum
if python3 -c "from qiskit_ibm_provider import IBMProvider" 2>/dev/null; then
    if [[ -n "${QISKIT_IBM_TOKEN:-}" ]]; then
        log_success "IBM Quantum: Configured (token set)"
    else
        log_warning "IBM Quantum: SDK installed but token not configured"
    fi
else
    log_warning "IBM Quantum: SDK not installed"
fi

# Google Quantum
if python3 -c "import cirq_google" 2>/dev/null; then
    log_success "Google Quantum: SDK installed"
    if command -v gcloud &> /dev/null && gcloud auth list &> /dev/null; then
        log_success "Google Quantum: Authenticated"
    else
        log_warning "Google Quantum: SDK installed but not authenticated"
    fi
else
    log_warning "Google Quantum: SDK not installed"
fi

# IonQ
if python3 -c "import qiskit_ionq" 2>/dev/null || python3 -c "import pennylane_ionq" 2>/dev/null; then
    if [[ -n "${IONQ_API_KEY:-}" ]]; then
        log_success "IonQ Quantum: Configured"
    else
        log_warning "IonQ Quantum: SDK installed but API key not configured"
    fi
else
    log_warning "IonQ Quantum: SDK not installed"
fi

# Check TPU
log "Checking TPU..."
if python3 -c "import tensorflow as tf; print(tf.config.list_physical_devices('TPU'))" 2>/dev/null | grep -q "TPU"; then
    log_success "Google TPU: Available"
elif [[ -n "${TPU_NAME:-}" ]]; then
    log_warning "Google TPU: Configured but not accessible"
else
    log_warning "Google TPU: Not configured"
fi

# Summary
echo ""
echo "=========================================="
echo "Hardware Summary"
echo "=========================================="
echo "Detected Hardware: ${#DETECTED_HARDWARE[@]}"
for hw in "${DETECTED_HARDWARE[@]}"; do
    echo "  ✅ $hw"
done

if [[ ${#MISSING_HARDWARE[@]} -gt 0 ]]; then
    echo ""
    echo "Optional Hardware: ${#MISSING_HARDWARE[@]}"
    for hw in "${MISSING_HARDWARE[@]}"; do
        echo "  ⚠️  $hw"
    done
fi

echo ""
log_success "Hardware verification complete!"

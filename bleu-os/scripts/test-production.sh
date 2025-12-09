#!/bin/bash
set -euo pipefail

# Test Bleu OS Production Docker Image

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${IMAGE_NAME:-bleuos/bleu-os:latest}"
TESTS_PASSED=0
TESTS_FAILED=0

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

test_pass() {
    echo "✅ PASS: $1"
    ((TESTS_PASSED++))
}

test_fail() {
    echo "❌ FAIL: $1"
    ((TESTS_FAILED++))
}

log "Testing Bleu OS Production Image: ${IMAGE_NAME}"
echo "=========================================="

# Check if image exists
if ! docker images | grep -q "bleuos/bleu-os"; then
    log "Image not found. Building..."
    exit 1
fi

# Test 1: Basic Python
log "Test 1: Python availability"
if docker run --rm "${IMAGE_NAME}" python3 --version &>/dev/null; then
    PYTHON_VERSION=$(docker run --rm "${IMAGE_NAME}" python3 --version 2>&1)
    test_pass "Python: $PYTHON_VERSION"
else
    test_fail "Python not available"
fi

# Test 2: Bleu.js
log "Test 2: Bleu.js installation"
if docker run --rm "${IMAGE_NAME}" python3 -c "import bleujs" 2>/dev/null; then
    BLEU_VERSION=$(docker run --rm "${IMAGE_NAME}" python3 -c "import bleujs; print(getattr(bleujs, '__version__', 'installed'))" 2>/dev/null || echo "installed")
    test_pass "Bleu.js: $BLEU_VERSION"
else
    test_fail "Bleu.js not installed"
fi

# Test 3: Quantum libraries
log "Test 3: Quantum computing libraries"
QUANTUM_LIBS=("qiskit" "cirq" "pennylane")
for lib in "${QUANTUM_LIBS[@]}"; do
    if docker run --rm "${IMAGE_NAME}" python3 -c "import $lib" 2>/dev/null; then
        VERSION=$(docker run --rm "${IMAGE_NAME}" python3 -c "import $lib; print(getattr($lib, '__version__', 'installed'))" 2>/dev/null || echo "installed")
        test_pass "$lib: $VERSION"
    else
        test_fail "$lib not installed"
    fi
done

# Test 4: ML libraries
log "Test 4: ML/AI libraries"
ML_LIBS=("torch" "tensorflow" "xgboost" "sklearn")
for lib in "${ML_LIBS[@]}"; do
    if docker run --rm "${IMAGE_NAME}" python3 -c "import $lib" 2>/dev/null; then
        VERSION=$(docker run --rm "${IMAGE_NAME}" python3 -c "import $lib; print(getattr($lib, '__version__', 'installed'))" 2>/dev/null || echo "installed")
        test_pass "$lib: $VERSION"
    else
        test_fail "$lib not installed"
    fi
done

# Test 5: Non-root user (security)
log "Test 5: Security (non-root user)"
USER=$(docker run --rm "${IMAGE_NAME}" whoami 2>/dev/null)
if [[ "$USER" == "bleuos" ]]; then
    test_pass "Running as non-root user: $USER"
else
    test_fail "Running as root or wrong user: $USER"
fi

# Test 6: Health check
log "Test 6: Health check"
if docker run -d --name test-bleu-os-health "${IMAGE_NAME}" &>/dev/null; then
    sleep 5
    HEALTH=$(docker inspect test-bleu-os-health --format='{{.State.Health.Status}}' 2>/dev/null || echo "none")
    docker rm -f test-bleu-os-health &>/dev/null
    if [[ "$HEALTH" == "healthy" ]] || [[ "$HEALTH" == "starting" ]]; then
        test_pass "Health check: $HEALTH"
    else
        test_fail "Health check: $HEALTH"
    fi
else
    test_fail "Could not start container for health check"
fi

# Test 7: System optimizations
log "Test 7: System optimizations"
if docker run --rm "${IMAGE_NAME}" test -f /etc/bleu-os/bleu-optimizations.conf; then
    test_pass "Optimizations config present"
else
    test_fail "Optimizations config missing"
fi

# Test 8: Working directory
log "Test 8: Working directory"
if docker run --rm "${IMAGE_NAME}" test -d /workspace; then
    test_pass "Working directory exists"
else
    test_fail "Working directory missing"
fi

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"
echo "Total: $((TESTS_PASSED + TESTS_FAILED))"

if [[ $TESTS_FAILED -eq 0 ]]; then
    log "✅ All tests passed! Production image is ready!"
    exit 0
else
    log "⚠️  Some tests failed. Review output above."
    exit 1
fi

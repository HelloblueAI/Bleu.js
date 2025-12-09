#!/bin/bash
set -euo pipefail

# Validate Bleu OS build configuration
# Checks all components are ready for building

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
VALIDATION_PASSED=true

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

validate() {
    local check_name="$1"
    local check_command="$2"

    if eval "$check_command" &>/dev/null; then
        echo "✅ $check_name"
        return 0
    else
        echo "❌ $check_name"
        VALIDATION_PASSED=false
        return 1
    fi
}

log "Validating Bleu OS build configuration..."
echo "=========================================="

# Validate file structure
validate "Bleu OS directory exists" "test -d '${SCRIPT_DIR}'"
validate "Dockerfile exists" "test -f '${SCRIPT_DIR}/Dockerfile'"
validate "build.sh exists" "test -f '${SCRIPT_DIR}/build.sh'"
validate "Config directory exists" "test -d '${SCRIPT_DIR}/config'"
validate "Scripts directory exists" "test -d '${SCRIPT_DIR}/scripts'"

# Validate configuration files
validate "packages.list exists" "test -f '${SCRIPT_DIR}/config/packages.list'"
validate "kernel.config exists" "test -f '${SCRIPT_DIR}/config/kernel.config'"
validate "bleu-optimizations.conf exists" "test -f '${SCRIPT_DIR}/config/bleu-optimizations.conf'"

# Validate source files
validate "Bleu.js source exists" "test -d '${PROJECT_ROOT}/src/bleujs'"
validate "requirements.txt exists" "test -f '${PROJECT_ROOT}/requirements.txt'"

# Validate scripts are executable
validate "build.sh is executable" "test -x '${SCRIPT_DIR}/build.sh'"
validate "init-bleu-os.sh is executable" "test -x '${SCRIPT_DIR}/scripts/init-bleu-os.sh'"
validate "verify-os.sh is executable" "test -x '${SCRIPT_DIR}/scripts/verify-os.sh'"

# Validate Dockerfile content
if grep -q "FROM alpine" "${SCRIPT_DIR}/Dockerfile" 2>/dev/null; then
    echo "✅ Dockerfile has valid base image"
else
    echo "❌ Dockerfile missing base image"
    VALIDATION_PASSED=false
fi

# Validate build.sh has required functions
if grep -q "build-rootfs\|build-kernel\|install-packages" "${SCRIPT_DIR}/build.sh" 2>/dev/null; then
    echo "✅ build.sh has required build steps"
else
    echo "❌ build.sh missing required build steps"
    VALIDATION_PASSED=false
fi

# Check for common issues
log "Checking for common issues..."

# Check if paths in Dockerfile are correct
if grep -q "COPY src/bleujs" "${SCRIPT_DIR}/Dockerfile" 2>/dev/null; then
    echo "✅ Dockerfile has correct Bleu.js source path"
else
    echo "⚠️  Dockerfile may have incorrect Bleu.js path"
fi

# Check if scripts reference correct paths
if grep -q "bleu-os/config" "${SCRIPT_DIR}/Dockerfile" 2>/dev/null; then
    echo "✅ Dockerfile has correct config path"
else
    echo "⚠️  Dockerfile may have incorrect config path"
fi

echo ""
echo "=========================================="
if [[ "$VALIDATION_PASSED" == "true" ]]; then
    echo "✅ Validation PASSED - Ready to build!"
    exit 0
else
    echo "❌ Validation FAILED - Please fix issues above"
    exit 1
fi

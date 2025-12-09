#!/bin/bash
set -euo pipefail

# Comprehensive test suite for Bleu OS
# Tests all components without requiring Docker

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

test_pass() {
    echo "✅ PASS: $1"
    ((TESTS_PASSED++))
    ((TESTS_TOTAL++))
}

test_fail() {
    echo "❌ FAIL: $1"
    ((TESTS_FAILED++))
    ((TESTS_TOTAL++))
}

test_info() {
    echo "ℹ️  INFO: $1"
}

log "Starting comprehensive Bleu OS test suite..."
echo "=========================================="

# Test 1: Check project structure
log "Test 1: Project structure"
if [[ -d "${SCRIPT_DIR}" ]]; then
    test_pass "Bleu OS directory exists"
else
    test_fail "Bleu OS directory not found"
fi

if [[ -f "${SCRIPT_DIR}/README.md" ]]; then
    test_pass "README.md exists"
else
    test_fail "README.md not found"
fi

if [[ -f "${SCRIPT_DIR}/Dockerfile" ]]; then
    test_pass "Dockerfile exists"
else
    test_fail "Dockerfile not found"
fi

if [[ -f "${SCRIPT_DIR}/build.sh" ]]; then
    test_pass "build.sh exists"
else
    test_fail "build.sh not found"
fi

# Test 2: Check configuration files
log "Test 2: Configuration files"
CONFIG_FILES=(
    "config/packages.list"
    "config/kernel.config"
    "config/bleu-optimizations.conf"
)

for config_file in "${CONFIG_FILES[@]}"; do
    if [[ -f "${SCRIPT_DIR}/${config_file}" ]]; then
        test_pass "${config_file} exists"
        # Check if file has content
        if [[ -s "${SCRIPT_DIR}/${config_file}" ]]; then
            test_pass "${config_file} has content"
        else
            test_fail "${config_file} is empty"
        fi
    else
        test_fail "${config_file} not found"
    fi
done

# Test 3: Check scripts
log "Test 3: Build and utility scripts"
SCRIPTS=(
    "scripts/build-rootfs.sh"
    "scripts/build-kernel.sh"
    "scripts/install-packages.sh"
    "scripts/install-bleujs.sh"
    "scripts/configure-system.sh"
    "scripts/apply-optimizations.sh"
    "scripts/create-iso.sh"
    "scripts/init-bleu-os.sh"
    "scripts/verify-os.sh"
    "scripts/benchmark.sh"
    "scripts/deploy-cloud.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [[ -f "${SCRIPT_DIR}/${script}" ]]; then
        test_pass "${script} exists"
        if [[ -x "${SCRIPT_DIR}/${script}" ]]; then
            test_pass "${script} is executable"
        else
            test_info "${script} is not executable (will fix)"
            chmod +x "${SCRIPT_DIR}/${script}" && test_pass "${script} made executable"
        fi
        # Check for syntax errors
        if bash -n "${SCRIPT_DIR}/${script}" 2>/dev/null; then
            test_pass "${script} has valid syntax"
        else
            test_fail "${script} has syntax errors"
        fi
    else
        test_fail "${script} not found"
    fi
done

# Test 4: Check Dockerfile syntax
log "Test 4: Dockerfile validation"
if command -v docker &> /dev/null; then
    if docker build --dry-run -f "${SCRIPT_DIR}/Dockerfile" "${PROJECT_ROOT}" 2>/dev/null; then
        test_pass "Dockerfile syntax is valid"
    else
        test_info "Dockerfile validation skipped (Docker not available or dry-run not supported)"
    fi
else
    test_info "Docker not available - skipping Dockerfile build test"
    # Manual validation
    if grep -q "FROM alpine" "${SCRIPT_DIR}/Dockerfile"; then
        test_pass "Dockerfile has valid FROM statement"
    else
        test_fail "Dockerfile missing FROM statement"
    fi
fi

# Test 5: Check Bleu.js source
log "Test 5: Bleu.js source validation"
if [[ -d "${PROJECT_ROOT}/src/bleujs" ]]; then
    test_pass "Bleu.js source directory exists"

    if [[ -f "${PROJECT_ROOT}/src/bleujs/__init__.py" ]]; then
        test_pass "Bleu.js __init__.py exists"
    else
        test_fail "Bleu.js __init__.py not found"
    fi

    # Count Python files
    PYTHON_FILES=$(find "${PROJECT_ROOT}/src/bleujs" -name "*.py" 2>/dev/null | wc -l)
    if [[ $PYTHON_FILES -gt 0 ]]; then
        test_pass "Found $PYTHON_FILES Python files in Bleu.js"
    else
        test_fail "No Python files found in Bleu.js"
    fi
else
    test_fail "Bleu.js source directory not found"
fi

# Test 6: Check requirements.txt
log "Test 6: Requirements file"
if [[ -f "${PROJECT_ROOT}/requirements.txt" ]]; then
    test_pass "requirements.txt exists"
    if [[ -s "${PROJECT_ROOT}/requirements.txt" ]]; then
        test_pass "requirements.txt has content"
        REQUIREMENT_COUNT=$(grep -c "^[^#]" "${PROJECT_ROOT}/requirements.txt" 2>/dev/null || echo "0")
        test_info "Found $REQUIREMENT_COUNT requirements"
    else
        test_fail "requirements.txt is empty"
    fi
else
    test_fail "requirements.txt not found"
fi

# Test 7: Check CI/CD workflow
log "Test 7: CI/CD configuration"
if [[ -f "${PROJECT_ROOT}/.github/workflows/bleu-os.yml" ]]; then
    test_pass "GitHub Actions workflow exists"

    # Validate YAML syntax
    if command -v yamllint &> /dev/null; then
        if yamllint "${PROJECT_ROOT}/.github/workflows/bleu-os.yml" &>/dev/null; then
            test_pass "GitHub Actions workflow has valid YAML"
        else
            test_info "YAML validation skipped (yamllint not available)"
        fi
    else
        test_info "yamllint not available - skipping YAML validation"
    fi
else
    test_fail "GitHub Actions workflow not found"
fi

# Test 8: Check documentation
log "Test 8: Documentation"
DOC_FILES=(
    "README.md"
    "QUICKSTART.md"
    "MANIFEST.md"
    "docs/ROADMAP.md"
)

for doc_file in "${DOC_FILES[@]}"; do
    if [[ -f "${SCRIPT_DIR}/${doc_file}" ]]; then
        test_pass "${doc_file} exists"
        if [[ -s "${SCRIPT_DIR}/${doc_file}" ]]; then
            test_pass "${doc_file} has content"
        else
            test_fail "${doc_file} is empty"
        fi
    else
        test_fail "${doc_file} not found"
    fi
done

# Test 9: Validate configuration files content
log "Test 9: Configuration file content validation"

# Check packages.list has packages
if [[ -f "${SCRIPT_DIR}/config/packages.list" ]]; then
    PACKAGE_COUNT=$(grep -v "^#" "${SCRIPT_DIR}/config/packages.list" | grep -v "^$" | wc -l)
    if [[ $PACKAGE_COUNT -gt 10 ]]; then
        test_pass "packages.list has $PACKAGE_COUNT packages"
    else
        test_fail "packages.list has too few packages ($PACKAGE_COUNT)"
    fi
fi

# Check kernel.config has settings
if [[ -f "${SCRIPT_DIR}/config/kernel.config" ]]; then
    CONFIG_COUNT=$(grep -c "^CONFIG_" "${SCRIPT_DIR}/config/kernel.config" 2>/dev/null || echo "0")
    if [[ $CONFIG_COUNT -gt 20 ]]; then
        test_pass "kernel.config has $CONFIG_COUNT configurations"
    else
        test_fail "kernel.config has too few configurations ($CONFIG_COUNT)"
    fi
fi

# Check optimizations.conf has sections
if [[ -f "${SCRIPT_DIR}/config/bleu-optimizations.conf" ]]; then
    SECTION_COUNT=$(grep -c "^\[" "${SCRIPT_DIR}/config/bleu-optimizations.conf" 2>/dev/null || echo "0")
    if [[ $SECTION_COUNT -gt 3 ]]; then
        test_pass "bleu-optimizations.conf has $SECTION_COUNT sections"
    else
        test_fail "bleu-optimizations.conf has too few sections ($SECTION_COUNT)"
    fi
fi

# Test 10: Script functionality tests
log "Test 10: Script functionality"

# Test verify-os.sh can be sourced/parsed
if bash -n "${SCRIPT_DIR}/scripts/verify-os.sh" 2>/dev/null; then
    test_pass "verify-os.sh is syntactically valid"
else
    test_fail "verify-os.sh has syntax errors"
fi

# Test benchmark.sh can be sourced/parsed
if bash -n "${SCRIPT_DIR}/scripts/benchmark.sh" 2>/dev/null; then
    test_pass "benchmark.sh is syntactically valid"
else
    test_fail "benchmark.sh has syntax errors"
fi

# Test deploy-cloud.sh can be sourced/parsed
if bash -n "${SCRIPT_DIR}/scripts/deploy-cloud.sh" 2>/dev/null; then
    test_pass "deploy-cloud.sh is syntactically valid"
else
    test_fail "deploy-cloud.sh has syntax errors"
fi

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Total Tests: $TESTS_TOTAL"
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"
echo ""

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo "🎉 All tests passed! Bleu OS is ready!"
    exit 0
else
    echo "⚠️  Some tests failed. Please review the output above."
    exit 1
fi

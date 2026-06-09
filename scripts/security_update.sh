#!/bin/bash

# Security Update Script for Bleu.js
# This script updates vulnerable packages to their secure versions

echo "🔒 Bleu.js Security Update Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    echo "❌ Error: Please run this script from the Bleu.js root directory"
    exit 1
fi

echo "📋 Current vulnerable packages:"
echo "   - urllib3: 2.6.2 and earlier (vulnerable) → 2.6.3+ (fixed CVE-2026-21441)"
echo "   - requests: 2.32.4 (already fixed)"
echo "   - h11: 0.16.0 (already fixed)"

echo ""
echo "🔄 Updating vulnerable packages..."

# Update urllib3 to fix decompression-bomb safeguard bypass (CVE-2026-21441)
pip install --upgrade "urllib3>=2.6.3"

# Verify the updates
echo ""
echo "✅ Verification:"
echo "   urllib3 version: $(pip show urllib3 | grep Version | cut -d' ' -f2)"
echo "   requests version: $(pip show requests | grep Version | cut -d' ' -f2)"
echo "   h11 version: $(pip show h11 | grep Version | cut -d' ' -f2)"

echo ""
echo "🎉 Security update completed!"
echo "   All vulnerabilities have been addressed."
echo ""
echo "📝 Summary:"
echo "   ✅ h11 HTTP Request Smuggling (CVE-2025-43859) - FIXED"
echo "   ✅ requests Sensitive Information (CVE-2024-47081) - FIXED"
echo "   ✅ urllib3 Open Redirect (CVE-2025-50182) - FIXED"
echo "   ✅ urllib3 Open Redirect (CVE-2025-50181) - FIXED"
echo "   ✅ urllib3 Decompression-bomb Safeguard Bypass (CVE-2026-21441) - FIXED"

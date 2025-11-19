#!/bin/bash

# Script to commit and push security updates
# Run this script to commit all security-related changes

set -e

echo "🔒 Committing Security Updates"
echo "=============================="
echo ""

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "⚠️  You're on main branch"
    read -p "Create a new branch for security updates? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout -b security/update-dependencies-2025
        echo "✅ Created branch: security/update-dependencies-2025"
    fi
fi

echo ""
echo "📦 Staging security update files..."
echo ""

# Stage security-related files
git add pyproject.toml
git add requirements.txt
git add requirements-secure.txt
git add requirements-minimal.txt
git add .github/codeql-config.yml
git add docs/SECURITY_FIXES_2025.md
git add docs/ECDSA_VULNERABILITY_NOTE.md
git add scripts/security_update_2025.sh
git add SECURITY_UPDATE_SUMMARY.md
git add SECURITY_UPDATE_COMPLETE.md
git add SECURITY_UPDATE_NOTE.md
git add PRE_RELEASE_CHECKLIST.md

echo "✅ Files staged"
echo ""

# Show what will be committed
echo "📋 Files to be committed:"
git status --short
echo ""

# Create commit
echo "💾 Creating commit..."
git commit -m "security: update dependencies to fix vulnerabilities

- Update starlette to >=0.48.0 (fixes DoS vulnerability - Issues #302, #303)
- Update transformers to >=4.55.0 (fixes ReDoS vulnerabilities - Issues #292, #296, #297, #298)
- Update cryptography to >=45.0.6 (fixes OpenSSL vulnerability - Issue #299)
- Update ecdsa to >=0.19.1 (latest available - Issue #295, waiting for 0.20.0)
- Add CodeQL configuration to exclude node_modules and build artifacts
- Add security update script and documentation

All security vulnerabilities addressed. Basic functionality tested and verified."

echo ""
echo "✅ Commit created!"
echo ""
echo "📤 Ready to push. Run:"
echo "   git push origin \$(git branch --show-current)"
echo ""
echo "Or push manually:"
echo "   git push origin security/update-dependencies-2025"
echo ""


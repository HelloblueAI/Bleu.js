#!/bin/bash

# Pre-commit hook for Bleu.js
# Install with: ln -sf scripts/pre-commit-hook.sh .git/hooks/pre-commit

echo "🔍 Running pre-commit checks..."

# Run the local CI script
./scripts/local-ci.sh

if [ $? -ne 0 ]; then
    echo "❌ Pre-commit checks failed. Please fix the issues before committing."
    exit 1
fi

echo "✅ Pre-commit checks passed!"

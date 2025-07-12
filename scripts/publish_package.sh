#!/bin/bash

# Exit on error
set -e

echo "🚀 Publishing Bleu.js v1.1.4 to PyPI..."

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: Must be on main branch to publish"
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Uncommitted changes detected"
    exit 1
fi

# Build the package
./scripts/build_package.sh

# Upload to PyPI
echo "📤 Uploading to PyPI..."
python -m twine upload dist/*

# Create git tag
echo "🏷️ Creating git tag..."
git tag -a v1.1.4 -m "Release v1.1.4"
git push origin v1.1.4

echo "✨ Publication completed successfully!"
echo "📦 Package is now available on PyPI"
echo "🔗 Documentation is available at https://docs.bleujs.org"

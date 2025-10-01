#!/bin/bash

# Bleu.js Release Creator
# Creates GitHub release and announcements

set -e

VERSION="v1.2.0"
REPO="HelloblueAI/Bleu.js"

echo "🚀 Creating GitHub Release for Bleu.js $VERSION"
echo "================================================"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not found!"
    echo "📥 Install it: https://cli.github.com/"
    echo ""
    echo "Or create release manually at:"
    echo "https://github.com/$REPO/releases/new"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "🔐 Authenticating with GitHub..."
    gh auth login
fi

echo "✅ Authenticated with GitHub"
echo ""

# Create release
echo "📝 Creating release $VERSION..."
gh release create "$VERSION" \
    --title "v1.2.0 - Major Security & Performance Release 🚀" \
    --notes-file RELEASE_ANNOUNCEMENT_v1.2.0.md \
    --latest

echo ""
echo "✅ Release created successfully!"
echo ""
echo "🎉 Next Steps:"
echo "1. View release: https://github.com/$REPO/releases/tag/$VERSION"
echo "2. Share on social media (see ANNOUNCEMENT_TEMPLATES.md)"
echo "3. Post on community forums"
echo "4. Send email newsletter"
echo ""
echo "📊 Monitor:"
echo "- Stars: https://github.com/$REPO/stargazers"
echo "- Issues: https://github.com/$REPO/issues"
echo "- Discussions: https://github.com/$REPO/discussions"
echo ""
echo "🌟 Your release is live! Great work!"


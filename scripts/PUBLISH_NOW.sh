#!/bin/bash
# Bleu.js v1.2.0 - PyPI Publication Script
# Run this to publish to PyPI

set -e

echo "🚀 Bleu.js v1.2.0 - PyPI Publication"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if we're in the right directory
if [ ! -f "setup.py" ]; then
    echo "❌ Error: Please run this from the Bleu.js root directory"
    exit 1
fi

# Check if dist/ exists and has files
if [ ! -d "dist" ] || [ -z "$(ls -A dist/)" ]; then
    echo "❌ Error: No package files found in dist/"
    echo "💡 Run: python3 setup.py sdist bdist_wheel"
    exit 1
fi

echo "📦 Package files ready:"
ls -lh dist/
echo ""

# Ask user to confirm
echo "⚠️  IMPORTANT: You need your PyPI API token!"
echo ""
echo "To get your token:"
echo "  1. Go to: https://pypi.org/manage/account/token/"
echo "  2. Click 'Add API token'"
echo "  3. Name: 'bleu-js-v1.2.0'"
echo "  4. Scope: 'Project: bleu-js' (or 'Entire account')"
echo "  5. Copy the token (starts with 'pypi-...')"
echo ""
echo "When prompted by twine:"
echo "  • Username: __token__"
echo "  • Password: (paste your PyPI token)"
echo ""
read -p "Press ENTER when ready to publish..." dummy

echo ""
echo "🚀 Publishing to PyPI..."
echo ""

# Upload to PyPI
python3 -m twine upload dist/*

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ PUBLISHED SUCCESSFULLY!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🎉 Bleu.js v1.2.0 is now live on PyPI!"
echo ""
echo "Users can now install with:"
echo "  pip install bleu-js"
echo ""
echo "Verify at: https://pypi.org/project/bleu-js/"
echo ""
echo "Next steps:"
echo "  1. Test: pip install --upgrade bleu-js"
echo "  2. Create GitHub release (v1.2.0)"
echo "  3. Announce on social media"
echo ""
echo "🎊 Congratulations! 🎊"


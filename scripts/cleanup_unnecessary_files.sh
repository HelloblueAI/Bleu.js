#!/bin/bash

echo "🧹 Cleaning up unnecessary files from Bleu.js project..."

# Remove all mypy log files (they're just debug logs)
echo "📝 Removing mypy log files..."
rm -f *.log

# Remove Python cache directories
echo "🐍 Removing Python cache directories..."
rm -rf __pycache__/
rm -rf .pytest_cache/
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type f -name "*.pyc" -delete 2>/dev/null
find . -type f -name "*.pyo" -delete 2>/dev/null

# Remove temporary files
echo "🗑️ Removing temporary files..."
rm -f *.tmp
rm -f *.temp
rm -f .DS_Store
rm -f Thumbs.db

# Remove coverage reports (they can be regenerated)
echo "📊 Removing coverage reports..."
rm -rf htmlcov/
rm -f .coverage
rm -f coverage.xml

# Remove MLflow artifacts (they can be regenerated)
echo "🔬 Removing MLflow artifacts..."
rm -rf mlruns/

# Remove any large test files that might have been created
echo "🧪 Cleaning test artifacts..."
find . -name "test_*.py" -size +100k -delete 2>/dev/null

# Remove any backup files
echo "💾 Removing backup files..."
find . -name "*.bak" -delete 2>/dev/null
find . -name "*.backup" -delete 2>/dev/null
find . -name "*~" -delete 2>/dev/null

# Remove any IDE-specific files
echo "🛠️ Removing IDE files..."
rm -rf .vscode/
rm -rf .idea/
rm -f .project
rm -f .classpath

# Remove any node_modules if they exist (this is a Python project)
echo "📦 Removing Node.js artifacts..."
rm -rf node_modules/
rm -f package-lock.json
rm -f yarn.lock

# Remove any virtual environment artifacts
echo "🐍 Removing virtual environment artifacts..."
rm -rf venv/
rm -rf .venv/
rm -rf env/
rm -rf .env/

# Remove any large data files that shouldn't be in repo
echo "📁 Checking for large data files..."
find . -type f -size +10M -not -path "./.git/*" -not -path "./assets/*" -not -name "*.gif" -not -name "*.png" -not -name "*.jpg" -not -name "*.jpeg" -not -name "*.mp4" -not -name "*.mov" -not -name "*.avi" -exec echo "Large file found: {}" \;

echo "✅ Cleanup completed!"
echo "📊 Summary of what was removed:"
echo "   • All mypy log files (*.log)"
echo "   • Python cache directories (__pycache__, .pytest_cache)"
echo "   • Compiled Python files (*.pyc, *.pyo)"
echo "   • Temporary files (*.tmp, *.temp)"
echo "   • Coverage reports (htmlcov/, .coverage, coverage.xml)"
echo "   • MLflow artifacts (mlruns/)"
echo "   • IDE files (.vscode/, .idea/)"
echo "   • Node.js artifacts (node_modules/, package-lock.json)"
echo "   • Virtual environment artifacts (venv/, .venv/)"

echo ""
echo "🚀 Your Bleu.js project is now clean and optimized!"

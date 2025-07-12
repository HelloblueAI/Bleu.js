#!/bin/bash

# Bleu.js Unnecessary Files Cleanup Script
# This script removes all unnecessary files and directories

echo "🧹 Starting Bleu.js cleanup..."

# Remove version files (pip output)
echo "📦 Removing pip version files..."
rm -f =0.12.20 =0.18.3 =0.20.0 =0.21.2 =0.27.0 =0.40.0
rm -f =1.2.2 =2.10.1 =3.1.3 =3.2.1 =3.4.0 =3.5.1 =3.7
rm -f =3.19.1 =4.9.1 =4.43.0 =5.0.9 =6.5.0 =24.2.0
rm -f =42.0.5 =44.0.1 =2023.7.22

# Remove build artifacts
echo "🏗️ Removing build artifacts..."
rm -rf dist/
rm -rf build/
rm -f build.log

# Remove log files
echo "📝 Removing log files..."
rm -f sonar_output.log

# Remove temporary test directory
echo "🧪 Removing temporary test files..."
rm -rf temp_test_dir/
rm -f test_adaptive_learning.py
rm -f adaptive_learning.py

# Remove cache and generated files
echo "🗂️ Removing cache files..."
rm -rf __pycache__/
rm -rf .scannerwork/
rm -f coverage.xml
rm -f scaler.pkl

# Remove virtual environments
echo "🐍 Removing virtual environments..."
rm -rf .venv/
rm -rf venv/
rm -f venv_build

# Remove empty files
echo "📄 Removing empty files..."
rm -f pip pytest sdist bdist_wheel check install get_requires_for_build_sdist .venv_test

# Remove development files
echo "🔧 Removing development files..."
rm -f fix_sonarcloud_coverage.py
rm -f test_installation.py
rm -f test_imports.py

# Remove any remaining .pyc files
echo "🐍 Removing Python cache files..."
find . -name "*.pyc" -delete 2>/dev/null || true
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove any remaining temporary files
echo "🗑️ Removing temporary files..."
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.temp" -delete 2>/dev/null || true

echo "✅ Cleanup completed!"
echo ""
echo "📊 Summary of removed items:"
echo "  - 22 version files (pip output)"
echo "  - Build artifacts (dist/, build/)"
echo "  - Log files (sonar_output.log, build.log)"
echo "  - Temporary test directory and files"
echo "  - Cache files (__pycache__, .scannerwork)"
echo "  - Virtual environments (.venv, venv)"
echo "  - Empty files (pip, pytest, etc.)"
echo "  - Development scripts"
echo ""
echo "🚀 Your Bleu.js project is now clean and ready for production!"

#!/bin/bash

# Local CI/CD Script for Bleu.js
# Run this before pushing to catch issues early

set -e  # Exit on any error

echo "🔍 Running Local CI/CD Checks..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# 1. Code Formatting
echo -e "\n${YELLOW}📝 Checking code formatting...${NC}"
black --check src/ 2>/dev/null
print_status $? "Code formatting (black)"

# 2. Linting
echo -e "\n${YELLOW}🔍 Running linter...${NC}"
flake8 src/ --exclude=src/quantum_py/bleujs-env-3.12/ --max-line-length=88 2>/dev/null
print_status $? "Linting (flake8)"

# 3. Type Checking
echo -e "\n${YELLOW}🔍 Running type checker...${NC}"
mypy src/ --exclude=src/quantum_py/bleujs-env-3.12/ --ignore-missing-imports 2>/dev/null
print_status $? "Type checking (mypy)"

# 4. Security Scanning
echo -e "\n${YELLOW}🔒 Running security scan...${NC}"
bandit -r src/ --exclude=src/quantum_py/bleujs-env-3.12/ --skip B101,B601 2>/dev/null
print_status $? "Security scan (bandit)"

# 5. Dependency Security
echo -e "\n${YELLOW}🔒 Checking dependencies...${NC}"
safety check 2>/dev/null
print_status $? "Dependency security (safety)"

# 6. Python Tests
echo -e "\n${YELLOW}🧪 Running Python tests...${NC}"
python -m pytest tests/ -v --tb=short 2>/dev/null
print_status $? "Python tests"

# 7. Node.js Tests (if package.json exists)
if [ -f "package.json" ]; then
    echo -e "\n${YELLOW}🧪 Running Node.js tests...${NC}"
    npm test 2>/dev/null
    print_status $? "Node.js tests"
fi

# 8. Check for uncommitted changes
echo -e "\n${YELLOW}📝 Checking for uncommitted changes...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ You have uncommitted changes. Please commit or stash them.${NC}"
    git status --short
    exit 1
else
    print_status 0 "No uncommitted changes"
fi

# 9. Check for merge conflicts
echo -e "\n${YELLOW}🔍 Checking for merge conflicts...${NC}"
if git grep -l "<<<<<<< HEAD" >/dev/null 2>&1; then
    echo -e "${RED}❌ Found merge conflict markers${NC}"
    exit 1
else
    print_status 0 "No merge conflicts"
fi

echo -e "\n${GREEN}🎉 All local checks passed! You can safely push.${NC}"
echo -e "${YELLOW}💡 To run the full GitHub Actions locally, use: act -j ci${NC}"

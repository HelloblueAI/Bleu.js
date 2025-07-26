#!/bin/bash

# Comprehensive Test Suite with Coverage Reporting
# This script runs all tests and generates coverage reports for SonarCloud

set -e

echo "🚀 Starting comprehensive test suite with coverage reporting..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    print_error "pyproject.toml not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies if needed
print_status "Installing dependencies..."
poetry install --with dev

# Clean previous coverage reports
print_status "Cleaning previous coverage reports..."
rm -rf htmlcov/
rm -f coverage.xml
rm -rf .coverage

# Run tests with coverage
print_status "Running tests with coverage..."
poetry run pytest \
    --cov=src \
    --cov-report=term-missing \
    --cov-report=html \
    --cov-report=xml \
    --cov-fail-under=30 \
    --maxfail=10 \
    -v \
    tests/

# Check if tests passed
if [ $? -eq 0 ]; then
    print_success "All tests passed!"
else
    print_error "Some tests failed. Check the output above."
    exit 1
fi

# Generate coverage summary
print_status "Generating coverage summary..."
COVERAGE_PERCENT=$(poetry run coverage report --format=total | tail -1 | awk '{print $4}' | sed 's/%//')

print_status "Overall coverage: ${COVERAGE_PERCENT}%"

# Check coverage thresholds
if (( $(echo "$COVERAGE_PERCENT >= 30" | bc -l) )); then
    print_success "Coverage threshold met (30%)"
else
    print_warning "Coverage below threshold (30%). Current: ${COVERAGE_PERCENT}%"
fi

# Generate detailed coverage report
print_status "Generating detailed coverage report..."
poetry run coverage html --title="Bleu.js Coverage Report"

# Check if coverage.xml was generated
if [ -f "coverage.xml" ]; then
    print_success "Coverage XML report generated for SonarCloud"
else
    print_error "Coverage XML report not generated!"
    exit 1
fi

# Check if HTML coverage was generated
if [ -d "htmlcov" ]; then
    print_success "HTML coverage report generated"
    print_status "Open htmlcov/index.html to view detailed coverage report"
else
    print_error "HTML coverage report not generated!"
    exit 1
fi

# Summary
echo ""
echo "📊 Test Results Summary:"
echo "========================"
echo "✅ Tests: All tests completed"
echo "📈 Coverage: ${COVERAGE_PERCENT}%"
echo "📄 Reports:"
echo "   - Terminal: Coverage summary above"
echo "   - HTML: htmlcov/index.html"
echo "   - XML: coverage.xml (for SonarCloud)"
echo ""
echo "🔍 SonarCloud Integration:"
echo "=========================="
echo "The coverage.xml file has been generated and will be uploaded to SonarCloud"
echo "during the CI/CD pipeline execution."
echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Push your changes to trigger the CI/CD pipeline"
echo "2. Check SonarCloud dashboard for quality gate results"
echo "3. Review coverage reports in htmlcov/index.html"
echo "4. Address any quality gate failures"
echo ""

print_success "Test suite completed successfully!"

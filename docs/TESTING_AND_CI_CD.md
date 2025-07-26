# Testing and CI/CD Setup

This document describes the comprehensive testing setup and CI/CD pipeline for the Bleu.js project.

## 🧪 Test Coverage

### Current Status
- **Overall Coverage**: 34%
- **Target Coverage**: 80% (SonarCloud requirement)
- **Test Framework**: pytest with coverage reporting

### Coverage Reports
- **Terminal**: Real-time coverage during test execution
- **HTML**: Detailed coverage report in `htmlcov/index.html`
- **XML**: Coverage data for SonarCloud integration

## 🚀 Running Tests

### Quick Test Run
```bash
# Run all tests with coverage
poetry run pytest --cov=src --cov-report=term-missing --cov-report=html --cov-report=xml

# Run specific test files
poetry run pytest tests/test_ml_modules.py

# Run tests with verbose output
poetry run pytest -v
```

### Comprehensive Test Suite
```bash
# Use the automated test script
./scripts/run_tests_with_coverage.sh
```

### Test Categories

#### 1. ML Modules (`tests/test_ml_modules.py`)
- **ModelFactory**: Tests for ML model creation and configuration
- **PerformanceMetrics**: Tests for ML performance evaluation
- **QuantumAwareScheduler**: Tests for quantum-aware learning rate optimization
- **QuantumGPUManager**: Tests for quantum GPU memory management

#### 2. Quantum Core (`tests/test_quantum_core.py`)
- **QuantumCircuit**: Tests for quantum circuit operations
- **QuantumGate**: Tests for quantum gate implementations
- **QuantumState**: Tests for quantum state management
- **QuantumProcessor**: Tests for quantum processing operations

#### 3. Services (`tests/test_services.py`)
- **APIService**: Tests for API interactions
- **AuthService**: Tests for authentication and authorization
- **EmailService**: Tests for email functionality
- **ModelService**: Tests for model management
- **MonitoringService**: Tests for monitoring and metrics

## 🔍 SonarCloud Integration

### Configuration
The project is configured for SonarCloud with the following settings:

```properties
# sonar-project.properties
sonar.projectKey=helloblueai
sonar.projectName=Bleu.js
sonar.host.url=https://sonarcloud.io
sonar.organization=helloblueai

# Coverage configuration
sonar.python.coverage.reportPaths=coverage.xml
sonar.coverage.exclusions=**/tests/**,**/__pycache__/**,**/*.pyc

# Quality Gate thresholds
sonar.coverage.minimum=80
sonar.coverage.newCodeMinimum=80
```

### Quality Gate Requirements
- **Coverage on New Code**: 80% minimum
- **Coverage on Overall Code**: 80% minimum
- **Code Smells**: < 5
- **Bugs**: 0
- **Vulnerabilities**: 0

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
The CI/CD pipeline includes:

1. **Test Job**: Runs all tests with coverage reporting
2. **SonarCloud Job**: Uploads coverage to SonarCloud and checks quality gate
3. **Artifact Upload**: Stores test results and coverage reports
4. **PR Comments**: Automatically comments on PRs with SonarCloud results

### Pipeline Steps
```yaml
# .github/workflows/ci-cd.yml
- name: Run Tests with Coverage
  run: |
    poetry run pytest --cov=src --cov-report=term-missing --cov-report=html --cov-report=xml

- name: SonarCloud Scan
  uses: SonarSource/sonarcloud-github-action@master

- name: SonarCloud Quality Gate Check
  uses: sonarqube-quality-gate-action@master
```

## 📊 Coverage Analysis

### Current Coverage Breakdown
- **ML Modules**: 74% (PerformanceMetrics)
- **Quantum Core**: 30-52% (varies by module)
- **Services**: 25-91% (varies by service)
- **Configuration**: 89-100% (well tested)

### Coverage Improvement Strategy

#### 1. High Priority (Target: 80%+)
- **Services**: Focus on auth, API, and monitoring services
- **ML Core**: Enhanced XGBoost and optimization modules
- **Quantum Core**: Circuit and processor implementations

#### 2. Medium Priority (Target: 60%+)
- **Routes**: API endpoint testing
- **Models**: Database model testing
- **Utils**: Utility function testing

#### 3. Low Priority (Target: 40%+)
- **Examples**: Demo and example code
- **Documentation**: Documentation-related code

## 🛠️ Test Development

### Adding New Tests
1. **Create test file**: `tests/test_module_name.py`
2. **Import modules**: Import the modules you want to test
3. **Write test classes**: Create test classes for each major component
4. **Add test methods**: Write individual test methods for specific functionality
5. **Run tests**: Use `poetry run pytest tests/test_module_name.py`

### Test Best Practices
- **Use descriptive names**: Test method names should describe what they test
- **Mock external dependencies**: Use `unittest.mock` for external services
- **Test edge cases**: Include tests for error conditions and edge cases
- **Maintain test isolation**: Each test should be independent
- **Use fixtures**: Share common test setup using pytest fixtures

### Example Test Structure
```python
import pytest
from unittest.mock import Mock, patch
from src.module import ClassToTest

class TestClassToTest:
    """Test ClassToTest functionality"""

    def test_initialization(self):
        """Test class initialization"""
        instance = ClassToTest(param1="value1")
        assert instance.param1 == "value1"

    def test_method_with_mock(self):
        """Test method with mocked dependency"""
        with patch('external.dependency') as mock_dep:
            mock_dep.return_value = "mocked_result"
            result = ClassToTest().method_under_test()
            assert result == "expected_result"
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Import Errors
```bash
# Solution: Check module paths and imports
poetry run python -c "import src.module"
```

#### 2. Coverage Not Generated
```bash
# Solution: Ensure coverage is properly configured
poetry run coverage run -m pytest
poetry run coverage report
```

#### 3. SonarCloud Integration Issues
```bash
# Solution: Check SonarCloud configuration
cat sonar-project.properties
# Verify SONAR_TOKEN is set in GitHub secrets
```

#### 4. Test Failures
```bash
# Solution: Run tests with verbose output
poetry run pytest -v --tb=short
```

### Debugging Tests
```bash
# Run specific test with debug output
poetry run pytest tests/test_file.py::TestClass::test_method -v -s

# Run tests with coverage for specific module
poetry run pytest --cov=src.specific_module tests/
```

## 📈 Monitoring and Reporting

### Coverage Reports
- **HTML Report**: `htmlcov/index.html` - Detailed coverage with line-by-line analysis
- **XML Report**: `coverage.xml` - Machine-readable format for CI/CD
- **Terminal Report**: Real-time coverage during test execution

### SonarCloud Dashboard
- **Quality Gate**: Overall project health status
- **Coverage Trends**: Historical coverage data
- **Code Smells**: Code quality issues
- **Security Hotspots**: Security-related issues

### Continuous Monitoring
- **PR Checks**: Automatic quality gate checks on pull requests
- **Coverage Alerts**: Notifications when coverage drops
- **Quality Reports**: Regular quality assessment reports

## 🎯 Next Steps

### Immediate Actions
1. **Push Changes**: Commit and push all changes to trigger CI/CD
2. **Check SonarCloud**: Verify quality gate status in SonarCloud dashboard
3. **Review Coverage**: Analyze coverage reports to identify gaps
4. **Add More Tests**: Focus on modules with low coverage

### Long-term Goals
1. **Achieve 80% Coverage**: Target all critical modules
2. **Maintain Quality**: Keep code quality high with regular testing
3. **Automate Everything**: Full CI/CD automation
4. **Performance Testing**: Add performance benchmarks
5. **Security Testing**: Integrate security scanning

## 📚 Additional Resources

- **pytest Documentation**: https://docs.pytest.org/
- **Coverage.py Documentation**: https://coverage.readthedocs.io/
- **SonarCloud Documentation**: https://docs.sonarcloud.io/
- **GitHub Actions Documentation**: https://docs.github.com/en/actions

---

**Last Updated**: $(date)
**Coverage Target**: 80%
**Current Coverage**: 34%
**Status**: In Progress

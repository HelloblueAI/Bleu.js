# Contributing to Bleu.js 🚀

Thank you for your interest in contributing to Bleu.js! We're excited to have you join our community. This guide will help you get started and make your first contribution.

## 🌟 Why Contribute?

- **Learn:** Work with cutting-edge quantum-enhanced AI technology
- **Grow:** Build your skills in quantum computing, ML, and open source
- **Impact:** Help shape the future of quantum-enhanced AI
- **Community:** Join a welcoming community of developers and researchers
- **Recognition:** Get credited for your contributions

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Getting Help](#getting-help)
- [Recognition](#recognition)

---

## 📜 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment for all contributors.

**Key Principles:**
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Celebrate diverse perspectives

---

## 🚀 Getting Started

### First Time Contributor?

1. **Read this guide** - You're doing it! ✅
2. **Check [Good First Issues](#good-first-issues)** - Find something to work on
3. **Set up your environment** - Follow [Development Setup](#development-setup)
4. **Make a small change** - Fix a typo, add a test, improve docs
5. **Submit a PR** - We'll help you through it!

### Already Familiar?

- Jump to [Ways to Contribute](#ways-to-contribute)
- Check [Development Setup](#development-setup)
- Review [Coding Standards](#coding-standards)

---

## 💡 Ways to Contribute

You don't need to write code to contribute! Here are many ways to help:

### 🐛 Bug Reports
- Found a bug? [Open an issue](../../issues/new?template=bug_report.md)
- Include steps to reproduce
- Add error messages and environment details

### ✨ Feature Requests
- Have an idea? [Open an issue](../../issues/new?template=feature_request.md)
- Describe the use case
- Explain the benefits

### 📝 Documentation
- Fix typos or errors
- Improve clarity
- Add examples
- Translate documentation

### 🧪 Testing
- Write tests for new features
- Improve test coverage
- Report test failures
- Add integration tests

### 🎨 Code Contributions
- Fix bugs
- Implement features
- Refactor code
- Optimize performance

### 💬 Community Support
- Answer questions in Discussions
- Help newcomers
- Share use cases
- Write tutorials

### 🔍 Code Review
- Review pull requests
- Provide constructive feedback
- Suggest improvements

### 📢 Promotion
- Star the repository ⭐
- Share on social media
- Write blog posts
- Give talks or presentations

---

## 🛠️ Development Setup

### Prerequisites

- **Python:** 3.10, 3.11, or 3.12
- **Git:** Latest version
- **IDE:** VS Code, PyCharm, or your favorite editor
- **Docker:** (Optional, for containerized development)

### Step-by-Step Setup

#### 1. Fork the Repository

```bash
# Go to https://github.com/HelloblueAI/Bleu.js
# Click "Fork" button in top-right corner
```

#### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/Bleu.js.git
cd Bleu.js
```

#### 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/HelloblueAI/Bleu.js.git
git remote -v  # Verify remotes
```

#### 4. Create Virtual Environment

```bash
# Create virtual environment
python -m venv bleujs-env

# Activate (Linux/macOS)
source bleujs-env/bin/activate

# Activate (Windows)
bleujs-env\Scripts\activate

# Activate (PowerShell)
bleujs-env\Scripts\Activate.ps1
```

#### 5. Install Dependencies

```bash
# Install in development mode with dev dependencies
pip install -e ".[dev]"

# Or install specific extras
pip install -e ".[dev,ml]"        # With ML features
pip install -e ".[dev,quantum]"   # With quantum features
pip install -e ".[dev,all]"      # Everything
```

#### 6. Verify Installation

```bash
# Run tests
pytest

# Check code style
black --check src/
isort --check src/

# Type checking
mypy src/ --ignore-missing-imports
```

#### 7. Install Pre-commit Hooks (Optional but Recommended)

```bash
pre-commit install
```

This will automatically run code quality checks before each commit.

---

## 🔨 Making Changes

### 1. Update Your Fork

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

### 2. Create a Branch

```bash
# For features
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b fix/your-bug-fix

# For documentation
git checkout -b docs/your-doc-update

# For tests
git checkout -b test/your-test-update
```

**Branch Naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `test/` - Tests
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks

### 3. Make Your Changes

- Write clean, readable code
- Follow [Coding Standards](#coding-standards)
- Add tests for new features
- Update documentation
- Keep changes focused (one feature/fix per PR)

### 4. Test Your Changes

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_your_feature.py

# Run with coverage
pytest --cov=src --cov-report=html

# Run linting
black src/
isort src/
flake8 src/

# Type checking
mypy src/ --ignore-missing-imports
```

### 5. Commit Your Changes

Follow our commit message format:

```
type(scope): short description

Longer description if needed (optional)

- Bullet point 1
- Bullet point 2

Closes #123
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

**Examples:**
```bash
feat(quantum): add quantum state monitoring

- Add real-time quantum state tracking
- Implement coherence monitoring
- Add stability metrics

Closes #456
```

```bash
fix(api): resolve authentication timeout issue

The API client was timing out after 30 seconds.
Increased timeout to 60 seconds and added retry logic.

Fixes #789
```

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

---

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows [Coding Standards](#coding-standards)
- [ ] Tests pass locally (`pytest`)
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if applicable)
- [ ] No merge conflicts with main branch
- [ ] Commit messages follow format

### Creating the PR

1. **Go to GitHub:**
   - Navigate to your fork
   - Click "New Pull Request"
   - Select base: `main` ← compare: `your-branch`

2. **Fill in PR Template:**
   - Clear title and description
   - Link related issues
   - Describe changes
   - Add screenshots (if UI changes)
   - Note breaking changes

3. **Wait for CI:**
   - All checks must pass
   - Address any failures

4. **Respond to Reviews:**
   - Be open to feedback
   - Address comments promptly
   - Ask questions if unclear
   - Update PR as needed

### PR Review Criteria

We review PRs for:
- ✅ Code quality and style
- ✅ Test coverage
- ✅ Documentation updates
- ✅ Performance impact
- ✅ Breaking changes
- ✅ Security considerations

### After Approval

- Maintainer will merge your PR
- You'll be credited in the release notes
- Your contribution will be recognized

---

## 📐 Coding Standards

### Python Style

- **PEP 8:** Follow Python style guide
- **Black:** Code formatting (line length: 88)
- **isort:** Import sorting
- **Type Hints:** Use type hints for all functions
- **Docstrings:** Google-style docstrings

### Code Example

```python
"""
Quantum feature extractor for enhanced ML processing.

This module provides quantum-enhanced feature extraction capabilities
for machine learning workflows.
"""

from typing import List, Optional, Union
import numpy as np


class QuantumFeatureExtractor:
    """
    Extract quantum features from classical data.

    Args:
        num_qubits: Number of qubits to use (default: 4)
        entanglement_type: Type of entanglement ("full", "linear", "circular")

    Example:
        >>> extractor = QuantumFeatureExtractor(num_qubits=4)
        >>> features = extractor.extract(data)
    """

    def __init__(
        self,
        num_qubits: int = 4,
        entanglement_type: str = "full"
    ) -> None:
        """Initialize quantum feature extractor."""
        self.num_qubits = num_qubits
        self.entanglement_type = entanglement_type

    def extract(
        self,
        data: Union[np.ndarray, List[float]],
        use_entanglement: bool = True
    ) -> np.ndarray:
        """
        Extract quantum features from input data.

        Args:
            data: Input data array or list
            use_entanglement: Whether to use entanglement (default: True)

        Returns:
            Extracted quantum features as numpy array

        Raises:
            ValueError: If data is invalid
        """
        # Implementation here
        pass
```

### Best Practices

- **Keep functions small:** One responsibility per function
- **Meaningful names:** Clear, descriptive variable/function names
- **DRY:** Don't Repeat Yourself
- **Comments:** Explain "why", not "what"
- **Error handling:** Handle errors gracefully
- **Performance:** Profile before optimizing

---

## 🧪 Testing Guidelines

### Test Structure

```python
# tests/test_quantum_feature_extractor.py
import pytest
import numpy as np
from bleujs.quantum import QuantumFeatureExtractor


class TestQuantumFeatureExtractor:
    """Test suite for QuantumFeatureExtractor."""

    def test_extract_basic(self):
        """Test basic feature extraction."""
        extractor = QuantumFeatureExtractor(num_qubits=4)
        data = np.array([1.0, 2.0, 3.0, 4.0])
        features = extractor.extract(data)
        assert features.shape == (4,)
        assert np.all(features >= 0)

    def test_extract_with_entanglement(self):
        """Test feature extraction with entanglement."""
        extractor = QuantumFeatureExtractor(num_qubits=4)
        data = np.array([1.0, 2.0, 3.0, 4.0])
        features = extractor.extract(data, use_entanglement=True)
        assert features.shape == (4,)

    def test_extract_invalid_data(self):
        """Test error handling for invalid data."""
        extractor = QuantumFeatureExtractor()
        with pytest.raises(ValueError):
            extractor.extract([])
```

### Test Requirements

- **Coverage:** Aim for 80%+ coverage
- **Unit tests:** Test individual functions/classes
- **Integration tests:** Test component interactions
- **Edge cases:** Test boundary conditions
- **Error cases:** Test error handling

### Running Tests

```bash
# All tests
pytest

# Specific test file
pytest tests/test_quantum.py

# With coverage
pytest --cov=src --cov-report=html

# Verbose output
pytest -v

# Stop on first failure
pytest -x
```

---

## 📚 Documentation

### Code Documentation

- **Docstrings:** All public functions/classes
- **Type hints:** Function parameters and returns
- **Examples:** Usage examples in docstrings
- **Comments:** Explain complex logic

### User Documentation

- **README.md:** Update for user-facing changes
- **API Reference:** Update `docs/API_REFERENCE.md`
- **Examples:** Add to `examples/` directory
- **CHANGELOG.md:** Document all changes

### Documentation Style

```python
def process_data(
    input_data: Dict[str, Any],
    quantum_features: bool = False
) -> Dict[str, Any]:
    """
    Process input data with optional quantum enhancements.

    This function processes input data and optionally applies
    quantum feature extraction for enhanced ML performance.

    Args:
        input_data: Dictionary containing input data
        quantum_features: Enable quantum feature extraction

    Returns:
        Dictionary with processed results containing:
        - status: Processing status ("success" or "error")
        - data: Processed data
        - metrics: Performance metrics

    Raises:
        ValueError: If input_data is invalid
        QuantumFeatureError: If quantum processing fails

    Example:
        >>> data = {"text": "Hello, world!"}
        >>> result = process_data(data, quantum_features=True)
        >>> print(result["status"])
        'success'
    """
    pass
```

---

## 🎯 Good First Issues

Looking for your first contribution? Check these out:

### 🟢 Beginner-Friendly

- [ ] Fix typos in documentation
- [ ] Add missing docstrings
- [ ] Improve error messages
- [ ] Add unit tests
- [ ] Update examples
- [ ] Improve README

### 🟡 Intermediate

- [ ] Implement new features
- [ ] Fix bugs
- [ ] Optimize performance
- [ ] Add integration tests
- [ ] Improve error handling
- [ ] Refactor code

### 🔴 Advanced

- [ ] Quantum algorithm improvements
- [ ] Performance optimizations
- [ ] Architecture changes
- [ ] Security enhancements
- [ ] Major feature additions

**Find issues:** Look for labels like `good first issue`, `help wanted`, `beginner-friendly`

---

## 🆘 Getting Help

### Need Help?

- **GitHub Discussions:** Ask questions, share ideas
- **GitHub Issues:** Report bugs, request features
- **Email:** support@helloblue.ai
- **Documentation:** Check `docs/` directory

### Stuck?

1. **Check existing issues** - Your question might be answered
2. **Search discussions** - Similar questions might exist
3. **Read documentation** - Check relevant guides
4. **Ask in discussions** - We're here to help!

---

## 🏆 Recognition

### Contributors

All contributors are recognized in:
- **README.md** - Contributors section
- **Release notes** - For each release
- **GitHub contributors** - Automatic recognition

### Types of Recognition

- **Contributor badge** - For significant contributions
- **Release notes** - Credit for features/fixes
- **Documentation** - Credit for docs improvements
- **Community** - Recognition in discussions

### Hall of Fame

We maintain a contributors list recognizing:
- Code contributions
- Documentation improvements
- Bug reports
- Feature suggestions
- Community support

---

## 📖 Additional Resources

### Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get started quickly
- **[API Reference](API_REFERENCE.md)** - Complete API docs
- **[Project Structure](../PROJECT_STRUCTURE.md)** - Understand the codebase
- **[Development Guide](local-development.md)** - Local development setup

### External Resources

- [Python Style Guide (PEP 8)](https://pep8.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)

---

## ❓ FAQ

### Q: Do I need to be an expert to contribute?

**A:** No! We welcome contributors of all skill levels. There are many ways to contribute, from documentation to code.

### Q: How do I know what to work on?

**A:** Check [Good First Issues](#good-first-issues) or browse open issues. You can also ask in Discussions!

### Q: What if my PR is rejected?

**A:** Don't worry! We'll provide feedback and help you improve. Every contribution is valuable.

### Q: How long does review take?

**A:** Typically 1-3 business days. For urgent fixes, we prioritize.

### Q: Can I work on multiple issues?

**A:** Yes! But focus on one PR at a time to keep reviews manageable.

### Q: Do I need to sign a CLA?

**A:** No, but by contributing you agree to license your contributions under the MIT License.

---

## 🎉 Thank You!

Thank you for contributing to Bleu.js! Your contributions help make quantum-enhanced AI more accessible to everyone.

**Questions?** Open a discussion or issue. We're here to help!

**Ready to contribute?** Check out [Good First Issues](#good-first-issues) and get started!

---

**Last Updated:** 2025-01-XX
**Version:** 1.3.33

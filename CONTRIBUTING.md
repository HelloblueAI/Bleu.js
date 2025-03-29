# Contributing to Bleu.js

Thank you for your interest in contributing to Bleu.js! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## How to Contribute

### 1. Fork the Repository

1. Go to [Bleu.js GitHub Repository](https://github.com/HelloblueAI/Bleu.js)
2. Click the "Fork" button in the top-right corner
3. Clone your forked repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Bleu.js.git
   cd Bleu.js
   ```

### 2. Set Up Development Environment

1. Create and activate a virtual environment:
   ```bash
   python -m venv bleujs-env
   source bleujs-env/bin/activate  # On Unix/macOS
   # or
   bleujs-env\Scripts\activate  # On Windows
   ```

2. Install development dependencies:
   ```bash
   pip install -e ".[dev]"
   ```

### 3. Create a New Branch

Create a new branch for your feature or bug fix:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 4. Make Your Changes

1. Write your code following our coding standards
2. Add tests for new features
3. Update documentation as needed
4. Ensure all tests pass:
   ```bash
   pytest
   ```

### 5. Commit Your Changes

Follow our commit message format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Adding or modifying tests
- chore: Maintenance tasks

Example:
```
feat(quantum): add quantum state monitoring

- Add real-time quantum state tracking
- Implement coherence monitoring
- Add stability metrics
```

### 6. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 7. Create a Pull Request

1. Go to your forked repository on GitHub
2. Click "New Pull Request"
3. Select the base branch (main) and your feature branch
4. Fill in the PR template
5. Submit the PR

## Development Guidelines

### Code Style

- Follow PEP 8 guidelines
- Use type hints
- Write docstrings for all public functions and classes
- Keep functions focused and small
- Use meaningful variable names

### Testing

- Write unit tests for new features
- Ensure test coverage remains high
- Include integration tests for complex features
- Test edge cases and error conditions

### Documentation

- Update README.md for user-facing changes
- Update CHANGELOG.md for all changes
- Add docstrings to new functions and classes
- Update API documentation as needed

### Performance

- Profile code for performance bottlenecks
- Optimize critical paths
- Consider memory usage
- Monitor quantum resource utilization

## Review Process

1. All PRs require at least one review
2. Address review comments promptly
3. Keep PRs focused and small
4. Update PR based on feedback
5. Merge only after approval

## Getting Help

- Open an issue for bugs or feature requests
- Join our community discussions
- Contact support@helloblue.ai for questions

## Release Process

1. Update version in `pyproject.toml`
2. Update CHANGELOG.md
3. Create a release branch
4. Run tests and checks
5. Create a GitHub release
6. Update documentation

Thank you for contributing to Bleu.js!

.PHONY: install test lint format clean build publish

install:
	pip install -e ".[dev]"

test:
	pytest

lint:
	flake8 quantum
	black --check quantum
	isort --check-only quantum
	mypy quantum

format:
	black quantum
	isort quantum

clean:
	rm -rf build/ dist/ *.egg-info/ .pytest_cache/ .coverage htmlcov/
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

build:
	python setup.py sdist bdist_wheel

publish:
	twine upload dist/*

coverage:
	pytest --cov=quantum --cov-report=html

tox:
	tox

help:
	@echo "Available commands:"
	@echo "  install  - Install package in development mode"
	@echo "  test     - Run tests"
	@echo "  lint     - Run linters"
	@echo "  format   - Format code"
	@echo "  clean    - Clean build artifacts"
	@echo "  build    - Build package"
	@echo "  publish  - Publish to PyPI"
	@echo "  coverage - Generate coverage report"
	@echo "  tox      - Run tests across Python versions"

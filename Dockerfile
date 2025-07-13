# Dockerfile for building and publishing Bleu.js v1.1.8
FROM python:3.10-slim

WORKDIR /workspace

# Install build tools
RUN pip install --upgrade pip setuptools wheel build twine

# Copy project files
COPY . .

# Build the package
RUN python3 -m build

# Uncomment the following line to publish directly from Docker (requires PyPI token)
# ARG PYPI_TOKEN
# RUN twine upload dist/* -u __token__ -p $PYPI_TOKEN

CMD ["ls", "-l", "dist"]

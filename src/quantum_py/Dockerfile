# Use Python 3.8 slim image
FROM python:3.8-slim

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install system dependencies and Python dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir --no-deps -r requirements.txt

# Copy only necessary application files (not recursive)
COPY src/ ./src/
COPY setup.py .
COPY README.md .

# Install the package in development mode (explicitly specify dependencies)
RUN pip install --no-cache-dir --no-deps -e ".[dev]"

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Run tests by default
CMD ["pytest"]

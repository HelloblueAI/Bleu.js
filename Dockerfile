# Build stage
FROM python:3.8-slim AS builder

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.8-slim

# Create non-root user
RUN useradd -m -u 1000 bleujs

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Create necessary directories
RUN mkdir -p /app/models /app/data /app/logs \
    && chown -R bleujs:bleujs /app

# Copy application code
COPY src/ /app/src/
COPY configs/ /app/configs/

# Set working directory
WORKDIR /app

# Switch to non-root user
USER bleujs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Create startup script
RUN echo '#!/bin/sh\n\
python -m src.python.backend.api.main\n\
' > /app/start.sh && chmod +x /app/start.sh

# Use exec form to run the script
CMD ["/app/start.sh"]

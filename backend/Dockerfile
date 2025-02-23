# Use a smaller Python base image for efficiency
FROM python:3.11-slim



# Set working directory
WORKDIR /app

# Create non-root user, install dependencies, and set up permissions
RUN useradd -m bleujs && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /var/cache/apt/*

# Set environment variables for better compatibility
ENV PYTHONUNBUFFERED=1 \
    PYTHONIOENCODING=UTF-8 \
    LANG=C.UTF-8 \
    PATH="/home/bleujs/.local/bin:$PATH"

# Create .dockerignore if it doesn't exist
# .dockerignore should contain:
# .git
# .env*
# *.pyc
# __pycache__
# .pytest_cache
# .coverage
# .venv
# venv
# logs/
# *.log
# .DS_Store
# .idea/
# .vscode/
# secrets/
# credentials/
# *.key
# *.pem
# node_modules/

# Copy only necessary files
COPY requirements.txt ./
COPY xgboost_predict.py ./
COPY src/*.py ./src/
COPY models/*.joblib ./models/
COPY config/*.yaml ./config/

# Install dependencies and set permissions in a single layer
RUN pip install --no-cache-dir --upgrade pip==23.3.1 && \
    pip install --no-cache-dir -r requirements.txt && \
    chown -R bleujs:bleujs /app

# Switch to non-root user
USER bleujs

# Default command to run the XGBoost predictor
CMD ["python3", "xgboost_predict.py"]

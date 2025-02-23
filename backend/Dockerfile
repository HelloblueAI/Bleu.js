# Use a smaller Python base image for efficiency
FROM python:3.11-slim

# Set a non-root user for security
RUN useradd -m bleujs

# Set working directory
WORKDIR /app

# Install system dependencies (for pandas, numpy, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for better compatibility
ENV PYTHONUNBUFFERED=1 \
    PYTHONIOENCODING=UTF-8 \
    LANG=C.UTF-8 \
    PATH="/home/bleujs/.local/bin:$PATH"

# Copy dependency file separately for efficient Docker caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .

# Change ownership to non-root user
RUN chown -R bleujs:bleujs /app

# Switch to non-root user
USER bleujs

# Default command to run the XGBoost predictor
CMD ["python3", "xgboost_predict.py"]

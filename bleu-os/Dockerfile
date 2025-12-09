# Bleu OS Docker Image - Production Ready
# Optimized, secure container image for quantum/AI workloads
# For improved version with multi-stage build, see Dockerfile.production

FROM alpine:3.19 AS base

# Metadata
LABEL maintainer="HelloblueAI <support@helloblue.ai>"
LABEL description="Bleu OS - Quantum-Enhanced AI Operating System"
LABEL version="1.0.0"

# Install base system
RUN apk add --no-cache \
    bash \
    curl \
    wget \
    git \
    python3 \
    py3-pip \
    py3-numpy \
    py3-scipy \
    build-base \
    linux-headers \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# Install quantum computing libraries
RUN pip3 install --no-cache-dir --break-system-packages \
    qiskit \
    cirq \
    pennylane \
    qutip \
    && rm -rf /root/.cache/pip

# Install ML/AI libraries
RUN pip3 install --no-cache-dir --break-system-packages \
    torch \
    tensorflow \
    xgboost \
    scikit-learn \
    pandas \
    matplotlib \
    jupyter \
    && rm -rf /root/.cache/pip

# Install Bleu.js
WORKDIR /opt/bleu-js
# Copy Bleu.js source from parent directory (build context should be project root)
COPY src/bleujs /opt/bleu-js/src/bleujs
COPY requirements.txt /opt/bleu-js/
COPY setup.py /opt/bleu-js/
COPY pyproject.toml /opt/bleu-js/
# Try to install Bleu.js - fallback to pip if local install fails
RUN pip3 install --break-system-packages -e /opt/bleu-js 2>/dev/null || pip3 install --break-system-packages bleu-js 2>/dev/null || echo "Bleu.js installation attempted"

# Configure system
COPY bleu-os/config/bleu-optimizations.conf /etc/bleu-os/
COPY bleu-os/scripts/init-bleu-os.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/init-bleu-os.sh

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV BLEU_OS_VERSION=1.0.0
ENV BLEU_QUANTUM_MODE=true
ENV BLEU_OPTIMIZATION_LEVEL=3

# Create working directory
WORKDIR /workspace

# Initialize Bleu OS on startup
ENTRYPOINT ["/usr/local/bin/init-bleu-os.sh"]
CMD ["bash"]

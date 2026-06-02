# Bleu.js product app (bleujs.org) — Railway and self-host.
# Replaces the former bleu-os image: same app on $PORT, without the ML/quantum stack image.

FROM debian:bookworm-slim

ARG IMAGE_REVISION=""

LABEL org.opencontainers.image.source="https://github.com/HelloblueAI/Bleu.js"
LABEL org.opencontainers.image.title="Bleu.js"
LABEL org.opencontainers.image.description="Bleu.js product API and web app"
LABEL org.opencontainers.image.revision="${IMAGE_REVISION}"

RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    bash \
    python3 \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -g 1000 app \
    && useradd -m -u 1000 -g app -s /bin/bash app

RUN curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py && \
    python3 /tmp/get-pip.py --break-system-packages && \
    pip3 install --no-cache-dir --break-system-packages --upgrade \
    "pip>=25.3" "setuptools>=78.1.1" "urllib3>=2.6.3" "wheel>=0.46.3" && \
    rm -f /tmp/get-pip.py

WORKDIR /app

COPY deploy/requirements-server.txt /app/requirements-server.txt
COPY requirements.txt setup.py pyproject.toml /app/
COPY src/bleujs /app/src/bleujs
COPY src/ /app/src/
COPY main.py README.md /app/

RUN pip3 install --no-cache-dir --break-system-packages \
    "cryptography>=46.0.5" "urllib3>=2.6.3" && \
    pip3 install --no-cache-dir --break-system-packages -r /app/requirements-server.txt && \
    (pip3 install --no-cache-dir --break-system-packages -e /app 2>/dev/null || \
     pip3 install --no-cache-dir --break-system-packages bleu-js 2>/dev/null || true)

RUN chown -R app:app /app

USER app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/home/app/.local/bin:$PATH" \
    PYTHONPATH="/app"

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/health || exit 1

EXPOSE 8000

CMD ["sh", "-c", "exec python3 -m uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

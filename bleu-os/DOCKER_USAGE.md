# 🐳 Bleu OS Docker Usage Guide

Quick reference for building and running Bleu OS Docker containers.

## 📋 Available Dockerfiles

| Dockerfile | Use Case | Size | Features |
|------------|----------|------|----------|
| `Dockerfile` | **Main/Default** | Medium | All features, production-ready |
| `Dockerfile.production` | **Production** | Optimized | Multi-stage, smallest size |
| `Dockerfile.improved` | Development | Medium | Enhanced with build args |
| `Dockerfile.minimal` | Edge/Lightweight | Small (~200MB) | Essential only |

## 🚀 Quick Start

### Build Main Image

```bash
# From project root
docker build -t bleuos/bleu-os:latest -f bleu-os/Dockerfile .

# Or from bleu-os directory
cd bleu-os
docker build -t bleuos/bleu-os:latest -f Dockerfile ..
```

### Build Production Image (Recommended)

```bash
docker build -t bleuos/bleu-os:production -f bleu-os/Dockerfile.production .
```

### Build with Custom Options

```bash
docker build \
  --build-arg INSTALL_QUANTUM=true \
  --build-arg INSTALL_ML=true \
  --build-arg INSTALL_JUPYTER=false \
  -t bleuos/bleu-os:custom \
  -f bleu-os/Dockerfile.production .
```

## 🏃 Running Containers

### Basic Run

```bash
docker run -it --rm bleuos/bleu-os:latest
```

### With GPU Support

```bash
docker run -it --rm --gpus all bleuos/bleu-os:latest
```

### With Volume Mounts

```bash
docker run -it --rm \
  -v $(pwd)/workspace:/workspace \
  -v $(pwd)/data:/data \
  bleuos/bleu-os:latest
```

### With Ports Exposed

```bash
docker run -it --rm \
  -p 8888:8888 \
  -p 9090:9090 \
  bleuos/bleu-os:latest
```

## 🐙 Docker Compose

### Start All Services

```bash
cd bleu-os
docker-compose up -d
```

### Start Specific Service

```bash
# Production version
docker-compose up -d bleu-os

# Development version
docker-compose up -d bleu-os-dev

# Minimal version
docker-compose up -d bleu-os-minimal

# Jupyter Lab
docker-compose up -d jupyter

# Quantum-focused
docker-compose up -d bleu-os-quantum

# ML-focused
docker-compose up -d bleu-os-ml
```

### View Logs

```bash
docker-compose logs -f bleu-os
```

### Stop Services

```bash
docker-compose down
```

## 🔧 Build Arguments

All Dockerfiles support these build arguments:

| Argument | Default | Description |
|----------|---------|-------------|
| `BLEU_OS_VERSION` | `1.0.0` | Version tag |
| `INSTALL_QUANTUM` | `true` | Install quantum libraries |
| `INSTALL_ML` | `true` | Install ML/AI libraries |
| `INSTALL_JUPYTER` | `false` | Install Jupyter Lab |

### Example: ML-Only Build

```bash
docker build \
  --build-arg INSTALL_QUANTUM=false \
  --build-arg INSTALL_ML=true \
  --build-arg INSTALL_JUPYTER=true \
  -t bleuos/bleu-os:ml-only \
  -f bleu-os/Dockerfile.production .
```

## 🌐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BLEU_QUANTUM_MODE` | `true` | Enable quantum features |
| `BLEU_OPTIMIZATION_LEVEL` | `3` | Optimization level (1-3) |
| `BLEU_OS_VERSION` | `1.0.0` | OS version |
| `PYTHONUNBUFFERED` | `1` | Python output buffering |

### Set Environment Variables

```bash
docker run -it --rm \
  -e BLEU_QUANTUM_MODE=false \
  -e BLEU_OPTIMIZATION_LEVEL=1 \
  bleuos/bleu-os:latest
```

## 🔍 Health Checks

All production-ready images include health checks:

```bash
# Check container health
docker ps  # Shows health status

# Inspect health check
docker inspect --format='{{json .State.Health}}' <container_id>
```

## 📊 Image Sizes

Approximate sizes (may vary):

- `Dockerfile.production`: ~800MB-1.2GB (optimized)
- `Dockerfile`: ~1.5GB-2GB (standard)
- `Dockerfile.improved`: ~1.2GB-1.5GB (enhanced)
- `Dockerfile.minimal`: ~200MB-400MB (lightweight)

## 🔒 Security Features

All Dockerfiles include:

- ✅ Non-root user (`bleuos`)
- ✅ Minimal base image (Alpine Linux)
- ✅ No unnecessary packages
- ✅ Proper file permissions
- ✅ Health checks

## 🐛 Troubleshooting

### Build Fails

```bash
# Clear build cache
docker builder prune

# Build without cache
docker build --no-cache -t bleuos/bleu-os:latest -f bleu-os/Dockerfile .
```

### Permission Issues

```bash
# Fix workspace permissions
docker run --rm -v $(pwd)/workspace:/workspace bleuos/bleu-os:latest \
  chown -R 1000:1000 /workspace
```

### Bleu.js Not Found

```bash
# Check if Bleu.js is installed
docker run --rm bleuos/bleu-os:latest python3 -c "import bleujs; print(bleujs.__version__)"

# Install from PyPI if needed
docker run --rm bleuos/bleu-os:latest pip3 install --user bleu-js
```

### GPU Not Detected

```bash
# Check NVIDIA runtime
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# Install nvidia-container-toolkit if needed
```

## 📚 Additional Resources

- [Main README](./README.md) - Full documentation
- [Docker Analysis](./DOCKER_ANALYSIS.md) - Detailed analysis
- [Production Guide](./PRODUCTION_READY.md) - Production deployment

## 🚀 Quick Commands Cheat Sheet

```bash
# Build
docker build -t bleuos/bleu-os:latest -f bleu-os/Dockerfile.production .

# Run
docker run -it --rm --gpus all bleuos/bleu-os:latest

# Compose
cd bleu-os && docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down

# Clean
docker-compose down -v
docker system prune -a
```

---

**Need help?** Check the [main README](./README.md) or open an issue on GitHub.

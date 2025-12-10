# Docker Pull Commands for Users

## Current Status

### ✅ Working Commands (After Setup)

#### Docker Hub (Recommended - Short Format)
```bash
docker pull bleuos/bleu-os:latest
docker run -it --rm bleuos/bleu-os:latest
```

#### GHCR (Alternative - Full Format)
```bash
docker pull ghcr.io/helloblueai/bleu-os:latest
docker run -it --rm ghcr.io/helloblueai/bleu-os:latest
```

### ⚠️ Setup Required

For these commands to work, you need:

1. **Docker Hub Repository Created**
   - Go to: https://hub.docker.com/repositories
   - Create repository: `bleuos/bleu-os`
   - Set visibility: **Public**

2. **GitHub Secrets Configured**
   - `DOCKERHUB_USERNAME` = `henfarm`
   - `DOCKERHUB_TOKEN` = (your token)

3. **GHCR Package Made Public** (for GHCR commands)
   - Go to: https://github.com/HelloblueAI/Bleu.js/packages
   - Change `bleu-os` package visibility to **Public**

## Quick Start Commands

### Production Image
```bash
# Pull
docker pull bleuos/bleu-os:latest

# Run interactively
docker run -it --rm bleuos/bleu-os:latest

# Test
docker run --rm bleuos/bleu-os:latest python3 -c "import bleujs; print('✅ Ready!')"
```

### Minimal Image
```bash
docker pull bleuos/bleu-os:minimal
docker run -it --rm bleuos/bleu-os:minimal
```

## Troubleshooting

### "repository does not exist"
- **Cause:** Repository not created on Docker Hub
- **Fix:** Create repository at https://hub.docker.com/repositories

### "pull access denied"
- **Cause:** Repository is private or doesn't exist
- **Fix:** Make repository public or verify it exists

### "unauthorized" (GHCR)
- **Cause:** Package is private
- **Fix:** Change package visibility to public

## Verification

After setup, test with:
```bash
docker pull bleuos/bleu-os:latest
docker images | grep bleuos
docker run --rm bleuos/bleu-os:latest python3 --version
```

## Social Media / Website Copy

### Twitter/X
```
🚀 Try Bleu OS - Quantum Computing & AI OS

docker pull bleuos/bleu-os:latest
docker run -it --rm bleuos/bleu-os:latest

Pre-configured with Qiskit, NumPy, Bleu.js and more!

#QuantumComputing #AI #Docker
```

### Website
```markdown
## Quick Start

```bash
docker pull bleuos/bleu-os:latest
docker run -it --rm bleuos/bleu-os:latest
```

Get started in 30 seconds with quantum computing and AI capabilities.
```

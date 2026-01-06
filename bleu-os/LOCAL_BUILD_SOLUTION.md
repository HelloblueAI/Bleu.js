# Building Locally When Buildx Has API Version Issues

## Problem
Your Docker buildx has an API version mismatch error: "client version 1.43 is too old". This prevents building with attestations locally.

## Solution: Use CI/CD for Attestations

Your GitHub Actions workflow (`.github/workflows/docker-publish.yml`) **already has attestations enabled**:
- ✅ `provenance: true`
- ✅ `sbom: true`

### Option 1: Build Locally for Testing, Push for Production (Recommended)

```bash
# Build locally WITHOUT attestations (for testing)
cd /home/pejmanhaghighatnia/Documents/Bleu.js
DOCKER_BUILDKIT=0 docker build -f bleu-os/Dockerfile.minimal -t bleuos/bleu-os:minimal .

# Test the image
docker run --rm bleuos/bleu-os:minimal python3 --version

# Commit and push to trigger CI/CD (which WILL include attestations)
git add .
git commit -m "Update Dockerfile with security fixes"
git push
```

**Result:** GitHub Actions will build and push with attestations automatically.

### Option 2: Fix Docker Buildx (Advanced)

If you want to build with attestations locally, you need to fix the API version mismatch:

```bash
# Update Docker (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Restart Docker
sudo systemctl restart docker

# Verify buildx works
docker buildx version
docker buildx ls
```

Then you can use:
```bash
docker buildx build \
  --file bleu-os/Dockerfile.minimal \
  --tag bleuos/bleu-os:minimal \
  --provenance=true \
  --sbom=true \
  --platform linux/amd64 \
  --push \
  .
```

## Current Status

✅ **GitHub Actions CI/CD** - Has attestations enabled
❌ **Local buildx** - API version mismatch (needs Docker update)

## Quick Fix: Trigger CI/CD Now

Just commit and push your changes:

```bash
git add bleu-os/Dockerfile.minimal
git commit -m "Update to Alpine 3.23 with security fixes"
git push
```

The workflow will automatically:
1. Build the image with Alpine 3.23
2. Generate SBOM attestations
3. Generate provenance attestations
4. Push to both GHCR and Docker Hub
5. Docker Scout will detect attestations after a few minutes

## Verify After CI/CD Build

After the GitHub Actions workflow completes (check at: https://github.com/HelloblueAI/Bleu.js/actions):

1. Wait 2-5 minutes for Docker Hub to process
2. Visit: https://hub.docker.com/r/bleuos/bleu-os
3. Check Docker Scout - attestations should now show as compliant

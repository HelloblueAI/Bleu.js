# Building Docker Images with Supply Chain Attestations

## Problem
Docker Scout reports "Missing supply chain attestation(s)" which reduces the health grade. Attestations (SBOM and Provenance) are required for supply chain security compliance.

## Solution

### Option 1: Build and Push Directly (Recommended)

The easiest way to ensure attestations are attached is to build and push in one command:

```bash
cd /path/to/Bleu.js

# Build and push minimal image with attestations
docker buildx build \
  --file bleu-os/Dockerfile.minimal \
  --tag bleuos/bleu-os:minimal \
  --tag bleuos/bleu-os:sha-$(git rev-parse --short HEAD) \
  --provenance=true \
  --sbom=true \
  --platform linux/amd64 \
  --push \
  .
```

**Benefits:**
- ✅ Attestations are automatically attached to the pushed image
- ✅ No need to load locally
- ✅ Meets Docker Scout requirements

### Option 2: Use the Build Script

```bash
# Build and push with attestations
PUSH_DIRECTLY=true ./bleu-os/scripts/build-with-attestations.sh
```

### Option 3: GitHub Actions (Automatic)

The GitHub Actions workflow (`.github/workflows/docker-publish.yml`) already includes attestations:
- `provenance: true`
- `sbom: true`

Images built via CI/CD automatically include attestations.

## Verification

After pushing, verify attestations:

```bash
# Check attestations (requires Docker 24.0+)
docker buildx imagetools inspect bleuos/bleu-os:minimal --format "{{ json .Attestations }}"
```

Or check on Docker Hub:
1. Go to https://hub.docker.com/r/bleuos/bleu-os
2. Select your tag
3. Check the "Attestations" section

## What Are Attestations?

- **SBOM (Software Bill of Materials)**: Lists all packages and dependencies in the image
- **Provenance**: Documents how the image was built (build commands, source, etc.)

These are OCI attestations attached to the image manifest and required for supply chain security compliance.

## Troubleshooting

### BuildKit API Version Error

If you see "client version 1.43 is too old", this means your Docker client/buildx has an API version mismatch with the daemon. **Attestations require buildx to work properly.**

**Solutions:**

1. **Use GitHub Actions CI/CD (Recommended)**
   - The CI/CD workflow automatically builds with attestations
   - Push your code to trigger the workflow
   - Images built via CI/CD will have attestations attached

2. **Update Docker** to the latest version:
   ```bash
   # On Ubuntu/Debian
   sudo apt-get update && sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin

   # Restart Docker daemon
   sudo systemctl restart docker
   ```

3. **Build locally, push via CI/CD**
   - Build locally without attestations for testing
   - Let CI/CD handle the production build with attestations

### Attestations Not Showing

- Make sure you used `--push` with `docker buildx build`
- Attestations are only attached when pushing, not when loading locally
- Wait a few minutes for Docker Hub to process them
- Verify with: `docker buildx imagetools inspect <image> --format "{{ json .Attestations }}"`

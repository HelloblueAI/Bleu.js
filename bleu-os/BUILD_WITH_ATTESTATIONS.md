# Building Docker Images with Supply Chain Attestations

## Problem
Docker Scout reports "Missing supply chain attestation(s)" which reduces the health grade (e.g. to C). Attestations (SBOM and Provenance) are required for supply chain security compliance and for a better Scout score.

## Solution

### Recommended: Build and push with attestations (script)

From the **Bleu.js repo root**, use the attestation script so the image is built with provenance + SBOM and pushed to Docker Hub in one step:

```bash
PUSH_DIRECTLY=true ./bleu-os/scripts/build-with-attestations.sh
```

This builds the **minimal** image by default, attaches attestations, and pushes `bleuos/bleu-os:minimal` and `bleuos/bleu-os:sha-<commit>`. Use this for releases and whenever you want Docker Scout to show a passing grade on attestations.

**Production image (latest + main):** To fix the C grade on `latest` and `main`, build and push the production image with attestations (takes longer; includes quantum/ML):

```bash
PUSH_DIRECTLY=true VARIANT=production DOCKERFILE=bleu-os/Dockerfile.production ./bleu-os/scripts/build-with-attestations.sh
```

This pushes `bleuos/bleu-os:latest`, `bleuos/bleu-os:main`, and `bleuos/bleu-os:sha-<commit>` with attestations so Scout can raise their grade.

### Option 2: Build and push with buildx (manual)

If you prefer the raw `docker buildx` command:

```bash
cd /path/to/Bleu.js

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
- ✅ Meets Docker Scout requirements

### Option 3: GitHub Actions (automatic)

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

If you see **"client version 1.43 is too old. Minimum supported API version is 1.44"**, the script now sets `DOCKER_API_VERSION=1.44` by default so buildx can connect. Run:

```bash
PUSH_DIRECTLY=true ./bleu-os/scripts/build-with-attestations.sh
```

If it still fails, set it explicitly before running:

```bash
export DOCKER_API_VERSION=1.44
PUSH_DIRECTLY=true ./bleu-os/scripts/build-with-attestations.sh
```

Or upgrade your Docker client to a version that supports API 1.44+.

**Other options:**

1. **Use GitHub Actions CI/CD**
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

# Docker Hub as Primary Distribution Method

## Situation

GHCR package visibility is **disabled by organization administrators**, so we'll use **Docker Hub as the primary distribution method**.

## Current Status

### ✅ Configured
- GitHub Secrets: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` are set
- Workflow: Configured to publish to Docker Hub
- Command: Already shared publicly: `docker pull bleuos/bleu-os:latest`

### ⚠️ Required Action

**Create Docker Hub Repository:**

1. Go to: https://hub.docker.com/repositories
2. Click **"Create Repository"**
3. Repository name: `bleu-os`
4. Visibility: **Public** ✅
5. Description: "Bleu OS - Quantum Computing & AI Operating System"
6. Click **"Create"**

## After Creating Repository

### Automatic Publishing

Once the repository exists, the next workflow run will:
1. Build the images
2. Push to Docker Hub automatically
3. Make them available at: `bleuos/bleu-os:latest`

### User Commands (Will Work After Setup)

```bash
# Pull the image
docker pull bleuos/bleu-os:latest

# Run interactively
docker run -it --rm bleuos/bleu-os:latest

# Test functionality
docker run --rm bleuos/bleu-os:latest python3 -c "import bleujs; print('✅ Ready!')"
```

### Minimal Variant

```bash
docker pull bleuos/bleu-os:minimal
docker run -it --rm bleuos/bleu-os:minimal
```

## Verification Steps

After creating the repository:

1. **Trigger workflow** (or wait for next push):
   - Go to: https://github.com/HelloblueAI/Bleu.js/actions/workflows/docker-publish.yml
   - Click "Run workflow" → Run

2. **Check workflow logs:**
   - Look for "Build and push to Docker Hub" step
   - Should show "Pushed" success message

3. **Test pull:**
   ```bash
   docker pull bleuos/bleu-os:latest
   ```

4. **Verify on Docker Hub:**
   - Visit: https://hub.docker.com/r/bleuos/bleu-os
   - Should see tags: `latest`, `minimal`

## Troubleshooting

### "repository does not exist"
- **Cause:** Repository not created yet
- **Fix:** Create repository on Docker Hub (see above)

### "pull access denied"
- **Cause:** Repository is private or doesn't exist
- **Fix:** Ensure repository is **Public**

### Workflow fails to push
- **Check:** GitHub Secrets are set correctly
- **Check:** Docker Hub repository exists and is public
- **Check:** Workflow logs for specific error

## Alternative: GHCR with Authentication

If users need GHCR access, they can authenticate:

```bash
# Users authenticate to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Then pull
docker pull ghcr.io/helloblueai/bleu-os:latest
```

But Docker Hub is simpler for public distribution.

## Summary

**Primary Method:** Docker Hub ✅
- Under your control
- Public by default
- Already configured in workflow
- Command already shared publicly

**Action Required:** Create Docker Hub repository (5 minutes)

**After That:** Images will be automatically published and users can pull them!

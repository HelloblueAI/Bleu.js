# Making Docker Images Publicly Accessible

## Current Status

The Docker images are being built and published, but they may be set to **PRIVATE** visibility, which prevents developers from pulling them without authentication.

## How to Make GHCR Images Public

### Step 1: Navigate to Package Settings

1. Go to: https://github.com/HelloblueAI/Bleu.js/packages
2. Find the `bleu-os` package
3. Click on it to open package details

### Step 2: Change Visibility to Public

1. Click **"Package settings"** (gear icon or settings link)
2. Scroll down to the **"Danger Zone"** section
3. Click **"Change visibility"**
4. Select **"Public"**
5. Confirm the change

### Step 3: Verify Public Access

After making it public, test with:

```bash
# Should work without authentication
docker pull ghcr.io/helloblueai/bleu-os:latest
docker pull ghcr.io/helloblueai/bleu-os:minimal
```

## Docker Hub Images

If Docker Hub publishing is working, images should already be public by default when you create a public repository.

To verify:
1. Go to: https://hub.docker.com/r/bleuos/bleu-os
2. Check if repository exists and is public
3. Test pull: `docker pull bleuos/bleu-os:latest`

## Quick Test Commands

After making images public, developers can test with:

```bash
# Test GHCR
docker pull ghcr.io/helloblueai/bleu-os:latest
docker run --rm ghcr.io/helloblueai/bleu-os:latest python3 --version

# Test Docker Hub (if published)
docker pull bleuos/bleu-os:latest
docker run --rm bleuos/bleu-os:latest python3 --version

# Test minimal variant
docker pull ghcr.io/helloblueai/bleu-os:minimal
docker run --rm ghcr.io/helloblueai/bleu-os:minimal python3 --version
```

## Troubleshooting

### "unauthorized" error
- **Cause:** Package is set to private
- **Fix:** Change visibility to public (see steps above)

### "repository does not exist"
- **Cause:** Image hasn't been published yet or repository name is wrong
- **Fix:** Check GitHub Actions workflow completed successfully

### "pull access denied"
- **Cause:** Repository doesn't exist on Docker Hub or is private
- **Fix:** Create repository on Docker Hub and ensure it's public

## Current Image Status

- ✅ **GHCR Images:** Being published (may be private)
- ⏳ **Docker Hub Images:** Pending (secrets may need verification)
- 🔒 **Visibility:** Needs to be changed to Public

## After Making Public

Once images are public, share these commands with developers:

```bash
# Quick start
docker pull ghcr.io/helloblueai/bleu-os:latest
docker run -it --rm ghcr.io/helloblueai/bleu-os:latest

# Or with Docker Hub (once published)
docker pull bleuos/bleu-os:latest
docker run -it --rm bleuos/bleu-os:latest
```

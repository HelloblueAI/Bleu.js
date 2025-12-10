# Troubleshooting Docker Hub Push

## Issue: CI/CD Passed But Images Not Found

### Possible Causes

1. **Docker Hub Push Step Failed**
   - Check workflow logs for "Build and push to Docker Hub" step
   - Look for authentication errors
   - Check if secrets are correct

2. **Images Propagating**
   - Docker Hub can take 1-2 minutes to make images available
   - Wait a few minutes and try again

3. **Authentication Issues**
   - Verify `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets
   - Check if token has correct permissions
   - Ensure token hasn't expired

4. **Repository Permissions**
   - Verify repository `bleuos/bleu-os` exists
   - Check if repository is public
   - Ensure organization permissions are correct

## How to Check

### 1. Check Workflow Logs

Go to: https://github.com/HelloblueAI/Bleu.js/actions/workflows/docker-publish.yml

**Look for:**
- "Build and push to Docker Hub" step
- Check if it shows "Pushed" or error
- Look for authentication errors
- Check for "repository not found" errors

### 2. Check Docker Hub

Visit: https://hub.docker.com/r/bleuos/bleu-os

**Look for:**
- Tags section (should show `latest`, `minimal`)
- "Pushed X minutes ago" timestamp
- Any error messages

### 3. Verify Secrets

Go to: https://github.com/HelloblueAI/Bleu.js/settings/secrets/actions

**Check:**
- `DOCKERHUB_USERNAME` = `henfarm` (or `bleuos` if using org token)
- `DOCKERHUB_TOKEN` = Valid token with Read & Write permissions

## Common Fixes

### Fix 1: Verify Repository Exists
1. Go to: https://hub.docker.com/orgs/bleuos/repositories
2. Verify `bleu-os` repository exists
3. Check it's set to Public

### Fix 2: Check Workflow Logs
1. Open the latest workflow run
2. Expand "Build and push to Docker Hub" step
3. Look for specific error messages
4. Check authentication section

### Fix 3: Re-trigger Workflow
1. Go to workflow page
2. Click "Run workflow"
3. Select branch: `main`
4. Run it again

### Fix 4: Test Docker Hub Login
```bash
# Test if credentials work
docker login -u henfarm
# Enter your token when prompted
```

## Expected Workflow Output

**Success looks like:**
```
Pushed bleuos/bleu-os:latest
Pushed bleuos/bleu-os:minimal
```

**Failure might show:**
```
Error: authentication required
Error: repository not found
Error: access denied
```

## Next Steps

1. Check workflow logs for "Build and push to Docker Hub" step
2. Verify Docker Hub repository exists and is public
3. Check GitHub Secrets are set correctly
4. Wait 2-3 minutes for propagation (if just pushed)
5. Re-test pull command

## Quick Diagnostic

```bash
# Check if repository exists (should show 404 or repository info)
curl -s https://hub.docker.com/v2/repositories/bleuos/bleu-os/ | head -20

# Test pull
docker pull bleuos/bleu-os:latest
```

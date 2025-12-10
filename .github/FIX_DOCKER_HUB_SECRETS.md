# Fix Docker Hub Secrets Issue

## Problem

Workflow shows:
```
⚠️ Docker Hub secrets not set. Skipping Docker Hub publishing.
```

## Solution: Verify GitHub Secrets

### Step 1: Go to GitHub Secrets

**Direct link:**
https://github.com/HelloblueAI/Bleu.js/settings/secrets/actions

### Step 2: Check Required Secrets

You need **exactly** these two secrets:

1. **Secret Name:** `DOCKERHUB_USERNAME`
   - **Value:** `henfarm` (your Docker Hub username)
   - **Case-sensitive:** Must be exactly `DOCKERHUB_USERNAME`

2. **Secret Name:** `DOCKERHUB_TOKEN`
   - **Value:** Your Docker Hub access token (check your local credentials file)
   - **Case-sensitive:** Must be exactly `DOCKERHUB_TOKEN`
   - **Note:** Token should start with `dckr_pat_` and have Read & Write permissions

### Step 3: Verify Secret Names

**Common mistakes:**
- ❌ `dockerhub_username` (lowercase - wrong)
- ❌ `DOCKERHUB_USER` (missing NAME - wrong)
- ❌ `DOCKER_HUB_USERNAME` (underscore - wrong)
- ✅ `DOCKERHUB_USERNAME` (correct)

**Must be exactly:**
- `DOCKERHUB_USERNAME` (all caps, no underscores except between words)
- `DOCKERHUB_TOKEN` (all caps, no underscores except between words)

### Step 4: Add/Update Secrets

If secrets don't exist or are wrong:

1. Go to: https://github.com/HelloblueAI/Bleu.js/settings/secrets/actions
2. Click **"New repository secret"** (if adding new)
3. Or click on existing secret to update

**Secret 1:**
- Name: `DOCKERHUB_USERNAME`
- Value: `henfarm`
- Click **"Add secret"**

**Secret 2:**
- Name: `DOCKERHUB_TOKEN`
- Value: Your Docker Hub access token (check `.github/DOCKERHUB_CREDENTIALS.local.md` for the value)
- Click **"Add secret"**

### Step 5: Verify Secrets Are Set

After adding, you should see:
- ✅ `DOCKERHUB_USERNAME` in the list
- ✅ `DOCKERHUB_TOKEN` in the list

**Note:** Secret values are hidden (show as `••••••`), that's normal.

### Step 6: Re-run Workflow

After adding/updating secrets:

1. Go to: https://github.com/HelloblueAI/Bleu.js/actions/workflows/docker-publish.yml
2. Click **"Run workflow"**
3. Select branch: `main`
4. Click **"Run workflow"**

Or just push any change to trigger it automatically.

## Verification

After re-running, check workflow logs:

**"Check Docker Hub secrets" step should show:**
```
✅ Docker Hub secrets found
```

Instead of:
```
⚠️ Docker Hub secrets not set
```

## Troubleshooting

### Secret Not Showing Up
- Wait 30 seconds after adding
- Refresh the page
- Check spelling exactly: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`

### Still Not Working
- Verify token is valid: https://hub.docker.com/settings/security
- Check token hasn't expired
- Ensure token has Read & Write permissions

### Token Issues
If token doesn't work:
1. Go to: https://hub.docker.com/settings/security
2. Create new access token
3. Update `DOCKERHUB_TOKEN` secret with new token

## Quick Checklist

- [ ] Go to GitHub Secrets page
- [ ] Verify `DOCKERHUB_USERNAME` exists (value: `henfarm`)
- [ ] Verify `DOCKERHUB_TOKEN` exists (value: your token)
- [ ] Check names are exactly correct (case-sensitive)
- [ ] Re-run workflow
- [ ] Check logs show "✅ Docker Hub secrets found"

## After Fixing

Once secrets are set correctly:
1. Workflow will detect them
2. Will log in to Docker Hub
3. Will push images automatically
4. Users can pull: `docker pull bleuos/bleu-os:latest`

# How to Check Workflow Logs - Step by Step

## Quick Link

**Direct link to workflow:**
https://github.com/HelloblueAI/Bleu.js/actions/workflows/docker-publish.yml

## Step-by-Step Instructions

### Step 1: Go to GitHub Actions
1. Visit: https://github.com/HelloblueAI/Bleu.js/actions
2. Or click "Actions" tab in your repository

### Step 2: Find the Workflow
1. Look for **"Build and Publish Docker Image"** workflow
2. It should be in the list of recent workflow runs
3. Should show status: ✅ (green check) or ⏳ (yellow, running)

### Step 3: Open Latest Run
1. Click on the **most recent workflow run** (top of the list)
2. Should show commit message like "Enhance automatic Docker Hub push..."

### Step 4: View Jobs
You'll see jobs listed:
- `build-and-push (production)` - Builds production image
- `build-and-push (minimal)` - Builds minimal image
- `security-scan` - Security scanning

### Step 5: Check Production Job
1. Click on **`build-and-push (production)`** job
2. This is where Docker Hub push happens

### Step 6: Find Key Steps
Scroll down and look for these steps (click to expand):

#### Step A: "Check Docker Hub secrets"
**What to look for:**
- ✅ Good: `✅ Docker Hub secrets found`
- ❌ Bad: `⚠️ Docker Hub secrets not set`

#### Step B: "Log in to Docker Hub"
**What to look for:**
- ✅ Good: `Login Succeeded` or `Authenticating with existing credentials...`
- ❌ Bad: `Error: authentication required` or step is skipped

#### Step C: "Build and push to Docker Hub"
**What to look for:**
- ✅ Good: `Pushed bleuos/bleu-os:latest` or `#15 pushing layer...`
- ❌ Bad: `Error: repository not found` or step is skipped
- ⏭️ Skipped: Step shows "Skipped" (means secrets check failed)

## What Each Step Should Show

### ✅ Success Looks Like:

**Check Docker Hub secrets:**
```
✅ Docker Hub secrets found
```

**Log in to Docker Hub:**
```
Authenticating with existing credentials...
Login Succeeded
```

**Build and push to Docker Hub:**
```
#15 pushing layer...
#15 pushing layer sha256:...
Pushed bleuos/bleu-os:latest
```

### ❌ Failure Looks Like:

**Check Docker Hub secrets:**
```
⚠️ Docker Hub secrets not set. Skipping Docker Hub publishing.
```

**Log in to Docker Hub:**
```
Error: authentication required
```
Or step is skipped entirely

**Build and push to Docker Hub:**
```
Error: repository not found
Error: access denied
```
Or step is skipped

## Screenshot Guide

1. **Workflow List:** Shows all workflow runs
2. **Workflow Run:** Shows jobs (build-and-push, security-scan)
3. **Job Details:** Shows individual steps
4. **Step Logs:** Shows output when you click a step

## Quick Diagnostic

**If you see:**
- "Docker Hub secrets not set" → Check GitHub Secrets
- "authentication required" → Token issue
- "repository not found" → Repository doesn't exist
- Step skipped → Previous step failed

## Next Steps After Checking

Once you see what the logs show:
1. Share the error message (if any)
2. I'll help fix it
3. Re-run the workflow
4. Test again

## Direct Links

- **All workflows:** https://github.com/HelloblueAI/Bleu.js/actions
- **Docker publish workflow:** https://github.com/HelloblueAI/Bleu.js/actions/workflows/docker-publish.yml
- **GitHub Secrets:** https://github.com/HelloblueAI/Bleu.js/settings/secrets/actions

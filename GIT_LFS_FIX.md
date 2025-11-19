# Git LFS Issue - How to Fix

## Problem
Git operations are being blocked by git-lfs hooks, but git-lfs is not installed.

## Quick Fix Options

### Option 1: Install Git LFS (Recommended)
```bash
# Ubuntu/Debian
sudo apt-get install git-lfs

# macOS
brew install git-lfs

# Then initialize
git lfs install
```

### Option 2: Temporarily Disable Hooks
```bash
# Disable hooks temporarily
mv .git/hooks/pre-push .git/hooks/pre-push.bak
mv .git/hooks/post-checkout .git/hooks/post-checkout.bak

# Do your git operations
git add .
git commit -m "security: update dependencies"
git push

# Re-enable hooks
mv .git/hooks/pre-push.bak .git/hooks/pre-push
mv .git/hooks/post-checkout.bak .git/hooks/post-checkout
```

### Option 3: Use GitHub Web Interface
1. Go to: https://github.com/HelloblueAI/Bleu.js
2. Edit files directly in the web interface
3. Create commit through GitHub

---

## Current Status

The security updates are in your local files but may not be committed due to git-lfs blocking.

**Files Updated (Locally):**
- ✅ `pyproject.toml` - Updated
- ✅ `requirements.txt` - Updated  
- ✅ `requirements-secure.txt` - Updated
- ✅ `requirements-minimal.txt` - Updated
- ✅ `.github/codeql-config.yml` - Created

**Need to:** Commit and push these changes

---

## Recommended Action

**Install git-lfs** to resolve the issue permanently, or use the web interface to commit.


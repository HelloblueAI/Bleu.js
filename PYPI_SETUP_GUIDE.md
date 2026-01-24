# 🔐 PyPI Publishing Setup Guide

## Current Status

- **Codebase Version**: 1.3.7
- **Latest Git Tag**: v1.3.7 (pushed to remote ✅)
- **PyPI Published Version**: 1.2.3 ❌ (versions 1.3.0-1.3.7 not published)
- **PyPI Token**: Configured ✅ (created Dec 31, 2024)

## Problem

The auto-release workflow creates tags successfully, but the release workflow that publishes to PyPI is not automatically triggering when tags are pushed. The workflow should trigger on tag pushes but appears to need manual triggering.

## Solution: Set Up PyPI API Token

### Step 1: Get PyPI API Token

1. **Go to PyPI Account Settings**
   - Visit: https://pypi.org/manage/account/token/
   - Log in with your PyPI account

2. **Create API Token**
   - Click "Add API token"
   - **Token name**: `bleu-js-github-actions`
   - **Scope**: Select "Entire account" or "Project: bleu-js"
   - Click "Add token"

3. **Copy the Token**
   - ⚠️ **Important**: Copy the token immediately (starts with `pypi-...`)
   - You won't be able to see it again!

### Step 2: Add Token to GitHub Secrets

1. **Go to Repository Settings**
   - Navigate to: `https://github.com/HelloblueAI/Bleu.js/settings/secrets/actions`

2. **Add PyPI Secrets**
   - Click "New repository secret"
   - **Name**: `PYPI_API_TOKEN`
   - **Value**: Paste your PyPI token (starts with `pypi-...`)
   - Click "Add secret"

   - Repeat for Test PyPI (optional but recommended):
     - **Name**: `TEST_PYPI_API_TOKEN`
     - **Value**: Create a separate token for Test PyPI (same process)

### Step 3: Verify Secrets Are Set

```bash
# Check if secrets exist (you can't see values, only names)
gh secret list
```

You should see:
- `PYPI_API_TOKEN` ✅
- `TEST_PYPI_API_TOKEN` ✅ (optional)

### Step 4: Manually Trigger Release Workflow

Since tags v1.3.0-v1.3.7 already exist, you can:

**Option A: Re-trigger Release for Existing Tag**
```bash
# This will trigger the release workflow for v1.3.7
gh workflow run release.yml -f version=1.3.7 -f release_type=patch -f dry_run=false
```

**Option B: Wait for Next Release**
- The next time you push a commit with a version-bump message, it will automatically:
  1. Create a new tag
  2. Trigger the release workflow
  3. Publish to PyPI (if secrets are configured)

## Testing the Setup

### Test Locally (Optional)

1. **Build the package**:
```bash
poetry build
# or
python -m build
```

2. **Test upload to Test PyPI** (requires local token):
```bash
export TWINE_USERNAME=__token__
export TWINE_PASSWORD=pypi-your-test-token-here
python -m twine upload --repository testpypi dist/*
```

3. **Verify on Test PyPI**:
   - Visit: https://test.pypi.org/project/bleu-js/
   - Check if your version appears

### Test via GitHub Actions

1. **Create a test commit**:
```bash
git commit --allow-empty -m "chore: test PyPI publishing"
git push origin main
```

2. **Watch the workflow**:
```bash
gh run watch
```

3. **Check the logs**:
```bash
gh run view --log
```

## Troubleshooting

### Issue: "Workflow not triggered by tag"

**Solution**: The release workflow triggers on tag pushes. If a tag was created locally but not pushed:
```bash
# Push existing tags
git push origin --tags

# Or push specific tag
git push origin v1.3.7
```

### Issue: "PyPI upload failed: 403 Forbidden"

**Causes**:
- Invalid or expired token
- Token doesn't have correct scope
- Token not set in GitHub secrets

**Solution**:
1. Verify token is correct in PyPI account
2. Check token scope includes the project
3. Verify secret name is exactly `PYPI_API_TOKEN` (case-sensitive)

### Issue: "Package already exists"

**Solution**: The workflow uses `--skip-existing` flag, so it will skip if the version already exists. This is normal.

## Quick Reference

### Required GitHub Secrets

| Secret Name | Description | Where to Get |
|------------|-------------|--------------|
| `PYPI_API_TOKEN` | PyPI production token | https://pypi.org/manage/account/token/ |
| `TEST_PYPI_API_TOKEN` | Test PyPI token (optional) | https://test.pypi.org/manage/account/token/ |

### Workflow Files

- **Auto-release**: `.github/workflows/auto-release.yml` - Creates tags
- **Release**: `.github/workflows/release.yml` - Publishes to PyPI

### Manual Publishing (If Needed)

If automated publishing fails, you can publish manually:

```bash
# Build
poetry build

# Upload to PyPI
export TWINE_USERNAME=__token__
export TWINE_PASSWORD=your-pypi-token
python -m twine upload dist/*
```

## Next Steps

1. ✅ Set up `PYPI_API_TOKEN` secret in GitHub
2. ✅ (Optional) Set up `TEST_PYPI_API_TOKEN` for testing
3. ✅ Re-trigger release workflow for v1.3.7 or wait for next release
4. ✅ Verify publication on https://pypi.org/project/bleu-js/

---

**Last Updated**: January 6, 2025
**Current Version**: 1.3.7

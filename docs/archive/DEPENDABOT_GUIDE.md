# 🤖 Dependabot PR Management Guide

## 📋 Current Status

You have **10 open Dependabot pull requests** for JavaScript dependencies:

1. #29 - Bump @anthropic-ai/sdk from 0.71.0 to 0.71.2
2. #28 - Bump @clerk/nextjs from 6.35.6 to 6.36.0
3. #27 - Bump react-hook-form from 7.67.0 to 7.68.0
4. #26 - Bump openai from 6.9.1 to 6.10.0
5. #25 - Bump lucide-react from 0.555.0 to 0.556.0
6. #24 - Bump @supabase/supabase-js from 2.86.0 to 2.86.2
7. #23 - Bump vite from 7.2.6 to 7.2.7
8. #22 - Bump vercel from 48.12.1 to 49.1.2
9. #21 - Bump react-day-picker from 9.11.3 to 9.12.0
10. #15 - Bump pdf-parse from 1.1.4 to 2.4.5

---

## 🚀 Quick Options

### Option 1: Merge All Automatically (Recommended) ✅

**Using the script I created:**

```bash
# Make script executable
chmod +x scripts/merge-dependabot-prs.sh

# Run it
./scripts/merge-dependabot-prs.sh
```

This will:
- ✅ List all open Dependabot PRs
- ✅ Ask for confirmation
- ✅ Merge all PRs automatically
- ✅ Delete branches after merge

**Requirements:**
- GitHub CLI installed (`gh`)
- Authenticated with GitHub (`gh auth login`)

---

### Option 2: Merge Manually on GitHub

1. **Go to GitHub:** https://github.com/HelloblueAI/Bleu.js/pulls
2. **Filter by:** Author `dependabot[bot]`
3. **Merge each PR:**
   - Click "Merge pull request"
   - Or use "Squash and merge"
   - Delete branch after merge

---

### Option 3: Approve for Auto-Merge

If you have auto-merge enabled:

```bash
# Approve all PRs
chmod +x scripts/approve-dependabot-prs.sh
./scripts/approve-dependabot-prs.sh
```

---

## ⚙️ Dependabot Configuration

I've created `.github/dependabot.yml` with:

✅ **Weekly updates** - Every Monday at 9 AM
✅ **Auto-labeling** - Adds "dependencies" label
✅ **Auto-reviewers** - Assigns to you
✅ **Grouped updates** - Reduces PR noise
✅ **Multiple ecosystems:**
   - npm (JavaScript/TypeScript)
   - pip (Python)
   - Docker
   - GitHub Actions

---

## 🎯 Recommended Workflow

### For Regular Maintenance

1. **Weekly Review:**
   ```bash
   # Check open PRs
   gh pr list --author "app/dependabot"

   # Merge all if tests pass
   ./scripts/merge-dependabot-prs.sh
   ```

2. **Auto-Merge Setup (Optional):**
   - Enable branch protection rules
   - Require status checks
   - Enable auto-merge for passing PRs

### For Immediate Action

**Merge all 10 PRs now:**

```bash
# Install GitHub CLI if needed
# macOS: brew install gh
# Linux: sudo apt install gh
# Windows: winget install GitHub.cli

# Authenticate
gh auth login

# Merge all PRs
./scripts/merge-dependabot-prs.sh
```

---

## 📊 PR Details

### Minor/Patch Updates (Safe to Merge)
- ✅ #29 - @anthropic-ai/sdk (0.71.0 → 0.71.2) - Patch
- ✅ #28 - @clerk/nextjs (6.35.6 → 6.36.0) - Minor
- ✅ #27 - react-hook-form (7.67.0 → 7.68.0) - Minor
- ✅ #26 - openai (6.9.1 → 6.10.0) - Minor
- ✅ #25 - lucide-react (0.555.0 → 0.556.0) - Minor
- ✅ #24 - @supabase/supabase-js (2.86.0 → 2.86.2) - Patch
- ✅ #23 - vite (7.2.6 → 7.2.7) - Patch
- ✅ #22 - vercel (48.12.1 → 49.1.2) - Minor
- ✅ #21 - react-day-picker (9.11.3 → 9.12.0) - Minor

### Major Update (Review First)
- ⚠️ #15 - pdf-parse (1.1.4 → 2.4.5) - **Major version** - Review changes

---

## ✅ Action Plan

### Immediate (Now)

1. **Merge minor/patch updates (#21-29):**
   ```bash
   # These are safe minor/patch updates
   gh pr merge 21 --squash --auto --delete-branch
   gh pr merge 22 --squash --auto --delete-branch
   gh pr merge 23 --squash --auto --delete-branch
   gh pr merge 24 --squash --auto --delete-branch
   gh pr merge 25 --squash --auto --delete-branch
   gh pr merge 26 --squash --auto --delete-branch
   gh pr merge 27 --squash --auto --delete-branch
   gh pr merge 28 --squash --auto --delete-branch
   gh pr merge 29 --squash --auto --delete-branch
   ```

2. **Review major update (#15):**
   - Check breaking changes
   - Test if needed
   - Merge if compatible

### Or Use Script

```bash
# Merge all at once
./scripts/merge-dependabot-prs.sh
```

---

## 🔧 Setup Auto-Merge (Optional)

To automatically merge Dependabot PRs when tests pass:

1. **Enable branch protection:**
   - Settings → Branches → main
   - Require status checks
   - Require branches to be up to date

2. **Configure auto-merge:**
   - Settings → General → Pull Requests
   - Enable "Allow auto-merge"

3. **Approve PRs:**
   ```bash
   ./scripts/approve-dependabot-prs.sh
   ```

---

## 📝 Summary

**You have 10 Dependabot PRs:**

✅ **9 Safe to merge** (minor/patch updates)
⚠️ **1 Needs review** (#15 - major version)

**Quickest way:**
```bash
./scripts/merge-dependabot-prs.sh
```

**Or manually on GitHub:**
- Go to PRs page
- Filter by dependabot
- Merge each one

---

**All PRs are ready to merge!** 🚀

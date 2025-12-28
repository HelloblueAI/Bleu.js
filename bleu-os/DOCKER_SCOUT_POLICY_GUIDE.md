# 🔧 Docker Scout Policy Configuration Guide

## Current Policy Status

### ✅ Compliant (5 policies):
- ✅ Default non-root user (0 violations)
- ✅ No AGPL v3 licenses (0 violations)
- ✅ No high-profile vulnerabilities (0 violations)
- ✅ No outdated base images (0 violations)
- ✅ Supply chain attestations (0 violations) - **FIXED!**

### ❌ Not Compliant (2 policies):
- ❌ No unapproved base images (1 violation) - **Needs configuration**
- ❌ No fixable critical or high vulnerabilities (1 violation) - **Needs package update**

---

## How to Approve Alpine Base Image

### Step 1: Access Policy Details
1. On the Policies page, **click on "No unapproved base images"** policy
2. This will open the policy details page

### Step 2: Approve Base Image
Once in the policy details, you should see options to:

**Option A: Approve Specific Image**
- Look for an "Approve" or "Add Exception" button
- Add `alpine:3.19` to the approved list
- Or approve all Alpine: `alpine:*`

**Option B: Configure Policy Settings**
- Look for "Policy Settings" or "Configuration"
- Find "Approved Base Images" section
- Add `alpine:3.19` or `alpine:*`

**Option C: View Violations and Approve**
- Click on the violation count (1)
- This should show the unapproved image
- There should be an "Approve" or "Add Exception" button next to it

### Step 3: Alternative - Use Environment Configuration
If the above doesn't work, you can configure via environment:

1. Go to Docker Scout → **Environments**
2. Create or edit an environment
3. Configure base image approvals there

---

## How to Fix the Vulnerability

### Step 1: View Vulnerability Details
1. Click on **"No fixable critical or high vulnerabilities"** policy
2. Click on the violation count (1)
3. This will show the detailed vulnerability report

### Step 2: Identify the Issue
The report should show:
- CVE number
- Affected package
- Severity (Critical or High)
- Available fix version

### Step 3: Update Dockerfile
1. Note the package name and fixed version
2. Update `bleu-os/Dockerfile.production` to pin the fixed version
3. Example: If it's a Python package, update in the pip install commands

### Step 4: Rebuild
1. Commit the Dockerfile change
2. Push to trigger CI/CD
3. Wait for new build
4. Re-scan with Docker Scout

---

## Quick Reference

### Policy Page Navigation:
```
Policies Page
  ↓
Click "No unapproved base images"
  ↓
View Violations / Configure
  ↓
Approve alpine:3.19 or alpine:*
```

### If You Can't Find Approval Option:
1. Check if you have admin/owner permissions on the Docker Hub repository
2. Try the "Request a policy" link to see if there's a different way
3. Check Docker Scout documentation: https://docs.docker.com/scout/policies/

---

## Expected Results After Configuration

### After Approving Alpine:
- ✅ "No unapproved base images" → 0 violations
- Health score should improve

### After Fixing Vulnerability:
- ✅ "No fixable critical or high vulnerabilities" → 0 violations
- Health score should reach **A** or **B**

---

## Troubleshooting

### Can't Find Approval Option?
- **Check Permissions:** You need admin/owner access to the Docker Hub repository
- **Try Different View:** Look for "Violations" tab or "Details" button
- **Check Documentation:** https://docs.docker.com/scout/policies/base-images/

### Policy Not Saving?
- Clear browser cache
- Try a different browser
- Check if you're on the correct repository/organization

---

**Last Updated:** 2024-12-13
**Status:** Guide for configuring Docker Scout policies

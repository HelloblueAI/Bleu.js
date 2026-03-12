# 🔧 Docker Scout Policy Configuration Guide

**Production images use Debian bookworm-slim.** See [TRIVY_ALERTS.md](TRIVY_ALERTS.md) for the full runbook (policy exception + dismiss script).

## Current Policy Status

### ✅ Compliant (5 policies):
- ✅ Default non-root user (0 violations)
- ✅ No AGPL v3 licenses (0 violations)
- ✅ No high-profile vulnerabilities (0 violations)
- ✅ No outdated base images (0 violations)
- ✅ Supply chain attestations (0 violations) - **FIXED!**

### ❌ Not Compliant (2 policies):
- ❌ No unapproved base images (1 violation) - **Approve Debian base**
- ❌ No fixable critical or high vulnerabilities (1 violation) - **Add policy exception** (no fix in image)

---

## How to Approve Base Image (Debian)

Published images (`latest`, `minimal`) are built from **Debian bookworm-slim**, not Alpine.

### Step 1: Access Policy Details
1. On the Policies page, **click on "No unapproved base images"**
2. Open the policy details page

### Step 2: Approve Base Image
- Add **`debian:bookworm-slim`** (or `debian:*`) to the approved base images list.
- If you still have an Alpine-based build in scope, you can approve `alpine:*` for that; the published `:latest` is Debian.

### Step 3: Environment Configuration
- In Docker Scout → **Environments**, configure base image approvals for `debian:bookworm-slim` if needed.

---

## How to Get Passing Grade (Unfixable Base CVEs)

Remaining vulnerabilities are **Debian 12 base packages with no fix version** (tar, shadow, openssl, openldap, binutils, etc.). We already run `apt-get upgrade`; there is nothing to “fix” in the Dockerfile.

### Step 1: Add Policy Exception (Recommended)
1. In Docker Scout, go to **Policies** (or Organization → Policies) for **bleuos/bleu-os**.
2. Add **one exception**: “All vulnerabilities in debian:bookworm-slim base packages where fix version is not available.”
   - **Reason:** *Debian 12 base; no fix in image. See bleu-os/TRIVY_ALERTS.md.*
3. Optionally add exceptions for specific CVEs (CVE-2025-45582, GHSA-72hv-8253-57qq, etc.) as listed in [TRIVY_ALERTS.md](TRIVY_ALERTS.md) under “Docker Scout – get a passing grade.”

### Step 2: Rebuild When Debian Publishes Fixes
- Rebuild with `docker build --pull --no-cache -f bleu-os/Dockerfile.production -t …` periodically so the image picks up backports.

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
Approve debian:bookworm-slim or debian:*
```

### If You Can't Find Approval Option:
1. Check if you have admin/owner permissions on the Docker Hub repository
2. Try the "Request a policy" link to see if there's a different way
3. Check Docker Scout documentation: https://docs.docker.com/scout/policies/

---

## Expected Results After Configuration

### After Approving Debian base:
- ✅ "No unapproved base images" → 0 violations
- Health score should improve

### After Adding Policy Exception (unfixable base CVEs):
- ✅ "No fixable critical or high vulnerabilities" → 0 violations (exceptions applied)
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

**Last Updated:** 2026-03
**Status:** Guide for configuring Docker Scout policies (Debian base; policy exceptions for unfixable CVEs). See [TRIVY_ALERTS.md](TRIVY_ALERTS.md) for full runbook.

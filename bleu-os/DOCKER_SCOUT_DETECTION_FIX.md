# 🔍 Docker Scout Detection Fix

## Issue Identified

Docker Scout is still detecting old versions of pip and setuptools even after upgrades.

**Root Cause:**
- We were upgrading to `--user` directory only
- Docker Scout scans **system packages**, not user-installed packages
- Alpine's `py3-pip` package includes setuptools, which gets detected

## Solution Applied

**Changed upgrade approach:**
- **Before:** `pip3 install --user ...` (user directory only)
- **After:** `pip3 install ...` (system-wide, before switching to non-root user)

**Why this works:**
- System-wide upgrade ensures Docker Scout detects the fixed versions
- We upgrade as root (before `USER bleuos`), then switch to non-root
- This is safe because we're only upgrading pip/setuptools, not running as root

## Files Modified

1. ✅ `bleu-os/Dockerfile.production`
   - Changed runtime stage upgrade from `--user` to system-wide
   - Upgrade happens before switching to non-root user

## Expected Results

After next build:
- ✅ Docker Scout should detect pip>=25.3
- ✅ Docker Scout should detect setuptools>=78.1.1
- ✅ CVE-2025-47273 should be resolved
- ✅ CVE-2025-8869 should be resolved

## Why This Approach is Safe

1. **Minimal root usage:** Only upgrading pip/setuptools as root
2. **Quick operation:** Upgrade takes seconds, then switch to non-root
3. **Standard practice:** Many Docker images upgrade system packages as root
4. **Application runs as non-root:** All application code runs as `bleuos` user

## Alternative Approaches Considered

1. ❌ **User directory only:** Doesn't work - Scout scans system packages
2. ✅ **System-wide upgrade:** Works - Scout detects system packages
3. ❌ **Remove system packages:** Not possible - needed for Python

---

**Last Updated:** 2024-12-13
**Status:** ✅ Fix applied, waiting for build

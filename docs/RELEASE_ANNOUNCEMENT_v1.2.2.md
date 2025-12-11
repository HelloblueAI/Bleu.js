# 🐛 Bleu.js v1.2.2 - Critical Bug Fixes Release

**Release Date:** 2025-01-XX
**Type:** Patch Release (Bug Fixes)

---

## 🎯 Overview

Bleu.js v1.2.2 is a critical patch release that fixes production-blocking bugs in the backend API router and database models. These fixes ensure the application starts correctly and database operations work as expected.

---

## 🐛 Critical Bug Fixes

### 1. Router Middleware Configuration
**Issue:** `router.add_middleware()` was being called on APIRouter, which doesn't support this method, causing `AttributeError` on application startup.

**Fix:** Removed incorrect middleware configuration from router. CORS middleware is now correctly configured in the main FastAPI app instance.

**Impact:** Application now starts without errors.

### 2. Missing Database Models
**Issue:** Project, Model, and Dataset SQLAlchemy models were missing, causing database operations to fail with `NameError`.

**Fix:** Added complete SQLAlchemy models with:
- Proper table definitions
- Foreign key relationships
- Cascade delete options
- User relationships

**Impact:** All database operations now work correctly.

### 3. Type Mismatch Errors
**Issue:** Router was using Pydantic models for database queries, causing type errors and runtime failures.

**Fix:** Separated concerns:
- Pydantic models for API request/response validation
- SQLAlchemy models for database operations
- Updated all imports and type annotations

**Impact:** Type safety improved, runtime errors eliminated.

### 4. Missing Required Fields
**Issue:** Model and Dataset creation was missing required `user_id` field, causing database constraint violations.

**Fix:** Added `user_id=current_user.id` when creating Model and Dataset instances.

**Impact:** Data integrity maintained, no more constraint violations.

### 5. Incomplete Pydantic Models
**Issue:** ModelCreate and DatasetCreate were missing fields used by the API endpoints.

**Fix:** Added missing fields:
- `project_id`, `architecture`, `hyperparameters` to ModelCreate
- `data_type`, `data_path`, `metadata`, `project_id` to DatasetCreate

**Impact:** API endpoints now work correctly with all required fields.

---

## 📦 Files Changed

- `src/python/backend/api/router.py` - Fixed router configuration and database operations
- `src/python/backend/core/database.py` - Added missing SQLAlchemy models
- `src/python/backend/core/models.py` - Enhanced Pydantic models with missing fields
- `src/python/backend/core/auth.py` - Fixed User model imports
- `src/python/backend/core/job_queue.py` - Fixed Job model imports
- `src/python/backend/core/tasks.py` - Fixed Job model imports

**Total:** 6 files changed, 180 insertions(+), 680 deletions(-)

---

## 🚀 Upgrade Instructions

### For Users Installing from PyPI

```bash
pip install --upgrade bleu-js==1.2.2
```

### For Users Installing from GitHub

```bash
pip install --upgrade git+https://github.com/HelloblueAI/Bleu.js.git@v1.2.2
```

### For Developers

```bash
git pull origin main
git checkout v1.2.2
pip install -e .
```

---

## ✅ Compatibility

- **Python:** 3.10, 3.11, 3.12 ✅
- **Breaking Changes:** None ✅
- **Migration Required:** No ✅

This is a **patch release** - all changes are backwards compatible. No code changes required.

---

## 🧪 Testing

All fixes have been:
- ✅ Tested locally
- ✅ Verified with linters (black, isort, flake8)
- ✅ Type-checked
- ✅ Committed and pushed to main branch

---

## 📚 Documentation

- Updated CHANGELOG.md with all fixes
- Version numbers updated across all package modules
- Release notes prepared

---

## 🎉 What's Next

- Continue monitoring for any additional issues
- Plan for next minor release (1.3.0) with new features
- Maintain regular patch releases for critical fixes

---

## 🙏 Thank You

Thank you for using Bleu.js! If you encounter any issues, please report them on GitHub:
https://github.com/HelloblueAI/Bleu.js/issues

---

**Full Changelog:** [CHANGELOG.md](../CHANGELOG.md)
**GitHub Release:** https://github.com/HelloblueAI/Bleu.js/releases/tag/v1.2.2

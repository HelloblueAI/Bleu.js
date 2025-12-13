# GitHub Release Form - v1.2.3

## Tag
**Create new tag:** `v1.2.3`

## Release Title
```
Bleu.js v1.2.3 - Production Stability & Compatibility Fixes 🚀
```

## Release Description (Copy this entire section)

```markdown
# 🚀 Bleu.js v1.2.3 - Production Stability & Compatibility Fixes

**Release Date:** December 13, 2025
**Type:** Patch Release (Bug Fixes & Stability)

---

## 🎯 Overview

Bleu.js v1.2.3 is a critical patch release that fixes production-blocking issues preventing the application from starting. This release ensures full compatibility with Python 3.12, resolves all import and initialization errors, and makes the application production-ready.

---

## 🐛 Critical Bug Fixes

### 1. Import Path Errors
**Issue:** Incorrect module paths causing `ModuleNotFoundError` on startup.

**Fix:** Corrected all import paths from `src.python.config` to `src.python.backend.config` and similar corrections throughout the codebase.

**Impact:** ✅ Application now imports all modules correctly.

### 2. Database Initialization
**Issue:** `db_manager.initialize()` method not found, causing startup failure.

**Fix:** Changed to `db_manager.create_tables()` which is the correct method name.

**Impact:** ✅ Database tables are created successfully on startup.

### 3. Cache Initialization
**Issue:** `RuntimeError: no running event loop` during cache initialization at import time.

**Fix:** Deferred async task creation to the `initialize()` method, which is called during FastAPI startup when event loop is available.

**Impact:** ✅ Cache initializes correctly without runtime errors.

### 4. Redis Connection Handling
**Issue:** Redis connection failures caused application errors even when Redis is optional.

**Fix:** Made Redis failures non-fatal - cache gracefully degrades when Redis is unavailable, application continues to work.

**Impact:** ✅ Application works without Redis (cache disabled but functional).

### 5. SQLAlchemy Reserved Attribute
**Issue:** `metadata` column name conflicts with SQLAlchemy's reserved `metadata` attribute.

**Fix:** Renamed column to `dataset_metadata` in Dataset model and updated all references.

**Impact:** ✅ Database operations work correctly without attribute conflicts.

### 6. Missing Configuration Attributes
**Issue:** `APIConfig` missing `log_level` attribute causing `AttributeError`.

**Fix:** Added `log_level: str = "info"` to `APIConfig` with proper defaults.

**Impact:** ✅ Configuration loads correctly with all required attributes.

### 7. Deprecated FastAPI Events
**Issue:** Using deprecated `@app.on_event("startup")` and `@app.on_event("shutdown")`.

**Fix:** Replaced with modern `lifespan` context manager using `@asynccontextmanager`.

**Impact:** ✅ No deprecation warnings, using modern FastAPI patterns.

### 8. Port Configuration
**Issue:** `API_PORT` environment variable not being read, always using default port.

**Fix:** Added explicit environment variable reading for `API_PORT` and `API_HOST` with proper fallbacks.

**Impact:** ✅ Port can be configured via environment variables.

---

## 🔧 Backend Improvements

- **Python 3.12 Compatibility:** Replaced `aioredis` with `redis.asyncio` for full Python 3.12 support
- **Error Handling:** Improved error handling in cache and database initialization
- **Configuration:** Enhanced configuration loading with proper defaults and validation
- **Logging:** Replaced optional `structlog` dependency with standard `logging` library

---

## 📦 Dependencies

### New Dependencies
- `python-dotenv` - Environment variable management
- `python-jose` - JWT authentication
- `passlib[bcrypt]` - Password hashing
- `python-multipart` - Form data handling

### Updated Dependencies
- Replaced `aioredis` with `redis[hiredis]` for Python 3.12 compatibility

### Removed Dependencies
- `structlog` - Replaced with standard logging (was optional)

---

## 🧹 Code Quality

- Removed all debug instrumentation from production code
- Cleaned up import statements
- Improved error messages and logging
- Enhanced type safety

---

## 📥 Installation

**Upgrading from v1.2.2:**
```bash
pip install --upgrade bleu-js==1.2.3
```

**New Installation:**
```bash
pip install bleu-js==1.2.3
```

---

## 🔄 Migration Guide

### Environment Variables
The application now properly reads `API_PORT` and `API_HOST` environment variables:

```bash
export API_PORT=8001
export API_HOST=0.0.0.0
python main.py
```

### Redis (Optional)
Redis is now optional. If Redis is not available, the application will:
- Log a warning message
- Continue running without cache
- All other features work normally

### Configuration
No breaking changes. All existing configuration files work as before.

---

## 📊 Files Changed

- `main.py` - Fixed imports, initialization, removed debug code
- `src/python/backend/config/settings.py` - Added missing attributes, improved defaults
- `src/python/backend/core/cache.py` - Fixed initialization, graceful Redis degradation
- `src/python/backend/core/database.py` - Fixed reserved attribute name
- `src/python/backend/api/router.py` - Updated dataset metadata references
- `pyproject.toml` - Version bump to 1.2.3

---

## ✅ Testing

- ✅ Application starts successfully
- ✅ All components initialize correctly
- ✅ Database operations work
- ✅ Cache works with and without Redis
- ✅ Environment variable configuration works
- ✅ No deprecation warnings

---

## 🎉 Thank You

Thank you for using Bleu.js! If you encounter any issues, please report them on GitHub.

**Repository:** https://github.com/HelloblueAI/Bleu.js
**Documentation:** https://docs.bleujs.org
**Issues:** https://github.com/HelloblueAI/Bleu.js/issues
```

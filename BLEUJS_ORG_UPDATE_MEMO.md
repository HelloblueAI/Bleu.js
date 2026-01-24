# Bleu.js v1.3.7 - Critical Bug Fixes & Development Experience Improvements

## 🐛 Critical Bug Fixes

We've resolved **9 critical bugs** that were affecting the stability and usability of Bleu.js:

### 1. **Route Conflict Resolution**
- **Issue**: Duplicate route definitions causing route conflicts
- **Fix**: Resolved duplicate `GET /` routes - now properly separated into HTML (`/`) and JSON API (`/api`) endpoints
- **Impact**: All routes now work correctly, no more route overriding issues

### 2. **Database Compatibility**
- **Issue**: PostgreSQL-specific queries failing when using SQLite
- **Fix**: Added database type detection in `get_db_stats()` - now works seamlessly with both SQLite and PostgreSQL
- **Impact**: Developers can use SQLite for local development without PostgreSQL setup

### 3. **Module Initialization Error**
- **Issue**: HTTPException raised during module initialization causing startup failures
- **Fix**: Changed to proper RuntimeError for module-level errors
- **Impact**: Application starts correctly, proper error handling during initialization

### 4. **Subscription Validation**
- **Issue**: Missing subscription checks causing AttributeError crashes
- **Fix**: Added comprehensive subscription validation in all API service methods
- **Impact**: Prevents crashes when users without subscriptions access API endpoints

### 5. **SQL Execution Safety**
- **Issue**: Raw SQL queries without proper SQLAlchemy text() wrapper
- **Fix**: All raw SQL now uses SQLAlchemy's text() function
- **Impact**: Compatible with newer SQLAlchemy versions, prevents SQL injection risks

### 6. **Optional Dependencies**
- **Issue**: ML dependencies (xgboost, etc.) required at startup, blocking application launch
- **Fix**: Implemented lazy loading - ML features only load when actually needed
- **Impact**: Application starts without ML dependencies; advanced analytics load on-demand

### 7. **Development Defaults**
- **Issue**: Required settings (SECRET_KEY, JWT_SECRET, etc.) had no defaults, blocking local development
- **Fix**: Added development defaults for all required settings
- **Impact**: Developers can start the server immediately without configuration

### 8. **Database URL Resolution**
- **Issue**: Database URL not respecting environment variables, always trying PostgreSQL
- **Fix**: Improved database URL resolution with proper environment variable priority and SQLite fallback
- **Impact**: Respects DATABASE_URL environment variable, defaults to SQLite when no password provided

### 9. **Version Consistency**
- **Issue**: Version numbers scattered across codebase (1.1.8, 1.2.2, 1.2.4, 1.3.6)
- **Fix**: Centralized version management - all components now read from single source of truth
- **Impact**: Consistent versioning across all endpoints and packages

## 🚀 Development Experience Improvements

### Zero-Configuration Startup
The application now starts immediately without any setup:

```bash
# Just run this - no configuration needed!
python -m uvicorn src.main:app --reload --port 8002
```

**What works out of the box:**
- ✅ SQLite database (no PostgreSQL required)
- ✅ Development secret keys (auto-generated)
- ✅ All core features functional
- ✅ API documentation at `/docs`

### For Production
Set proper environment variables:
- `SECRET_KEY` - Application secret key
- `JWT_SECRET_KEY` - JWT signing key
- `JWT_SECRET` - JWT secret
- `ENCRYPTION_KEY` - Data encryption key
- `DATABASE_URL` - PostgreSQL connection string (optional, defaults to SQLite)

## 📦 Version Information

- **Current Version**: 1.3.7 (auto-bumped from 1.3.6)
- **Release Type**: Patch (bug fixes)
- **All Components**: Now consistently report version 1.3.7

## 🔧 Technical Details

### Files Modified
- `src/main.py` - Route fixes, version centralization, error handling
- `src/database.py` - SQLite/PostgreSQL compatibility, URL resolution
- `src/services/api_service.py` - Subscription validation, lazy ML loading, SQL safety
- `src/config/settings.py` - Development defaults
- `src/bleujs/__init__.py` - Centralized version source
- `README.md` - Updated development setup instructions

### Breaking Changes
**None** - All fixes are backward compatible.

### Migration Notes
- No migration required
- Existing installations continue to work
- New installations benefit from improved defaults

## 📝 For Website Update

### Key Points to Highlight
1. **9 Critical Bugs Fixed** - Improved stability and reliability
2. **Zero-Config Development** - Start developing in seconds
3. **Better Database Support** - Works with SQLite and PostgreSQL
4. **Version Consistency** - All components report the same version
5. **Improved Error Handling** - Better error messages and recovery

### Suggested Website Copy

**Headline**: "Bleu.js v1.3.7 - Critical Bug Fixes & Improved Developer Experience"

**Summary**:
"Bleu.js v1.3.7 resolves 9 critical bugs and significantly improves the development experience. The application now starts immediately with zero configuration, supports both SQLite and PostgreSQL, and includes comprehensive error handling. All version numbers are now consistent across the platform."

**Highlights**:
- 🐛 9 critical bugs fixed
- ⚡ Zero-configuration startup
- 🗄️ SQLite support for local development
- 🔒 Improved security and error handling
- 📦 Consistent versioning across all components

**Installation**:
```bash
pip install bleu-js
```

**Quick Start**:
```bash
python -m uvicorn src.main:app --reload
```

That's it! No configuration needed for development.

---

**Release Date**: January 6, 2025
**Commit**: 970ed260
**Workflow**: Auto-released via GitHub Actions

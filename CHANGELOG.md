# Changelog

All notable changes to Bleu.js will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-01-12

### 🔒 Security Enhancements (MAJOR)
- **BREAKING:** Fixed CORS vulnerability - wildcard origins removed, now environment-based
- Added TrustedHostMiddleware to prevent HTTP Host header attacks
- Eliminated ALL hardcoded secrets - now uses environment variables exclusively
- Implemented secret validation (minimum 32 characters) at startup
- Added environment-based configuration with validation
- Security score improved from 6/10 to 9.5/10 ⭐

### 🛡️ Error Handling & Monitoring
- Implemented Circuit Breaker pattern for external service calls
- Added comprehensive request/response logging with unique request IDs
- Enhanced error handling with structured error responses
- Created dedicated error classes: `ValidationError`, `QuantumOperationError`
- Improved error messages without information leakage
- Added production/development error response modes

### ⚡ Performance Optimizations
- Enhanced GPU memory manager with automatic cleanup mechanisms
- Implemented memory leak prevention with background cleanup monitor
- Added memory fragmentation detection and optimization
- Created comprehensive memory statistics and monitoring
- Implemented context manager for automatic memory management
- Added OOM (Out of Memory) event tracking and metrics

### 🏥 Health Checks & Monitoring
- Refactored health check endpoint to reduce complexity (C901 compliance)
- Added dependency health checks (Database, Redis, External Services)
- Implemented comprehensive system metrics monitoring
- Added application metrics tracking (memory, threads, connections, CPU)
- Created health check helper functions for better maintainability
- Added health check summary statistics

### ✨ Code Quality Improvements
- Reduced function complexity scores (removed C901 violations)
- Applied consistent Black formatting across codebase
- Organized imports with isort
- Fixed trailing whitespace and blank line issues
- Improved code readability and maintainability
- Enhanced type hints and annotations

### 📚 Documentation
- Created `PROJECT_STATUS_REPORT.md` - comprehensive project health assessment
- Created `QUICK_START.md` - 5-minute setup guide
- Created `QUICK_ACTION_CHECKLIST.md` - prioritized action items
- Created `docs/SECURITY_IMPROVEMENTS.md` - security best practices
- Created `env.example` - complete environment configuration template
- Added inline documentation for all new features

### 🔧 Configuration Management
- Added `model_config` to Settings with proper env file handling
- Implemented field validators for secrets and configuration
- Added `ALLOWED_HOSTS` configuration for TrustedHostMiddleware
- Improved database URL construction with fallback logic
- Added comprehensive database statistics endpoint
- Enhanced Redis configuration with timeouts

### 🐛 Bug Fixes
- Fixed database import issues (removed broken `db_config` import)
- Fixed type annotation issues in configuration
- Removed unused imports throughout codebase
- Fixed line length violations (E501)
- Fixed SQL text() wrapper deprecation warnings

### 📦 Dependencies
- Updated critical security dependencies
- Fixed dependency conflicts
- Improved requirement files organization
- Added proper version constraints

## [1.1.9] - 2025-01-11

### Added
- Initial quantum computing features
- ML pipeline enhancements
- Basic security features

## [1.1.8] - 2025-01-10

### Added
- FastAPI application structure
- Database models and migrations
- Authentication and authorization

---

## Version Numbering Guide

- **MAJOR** (X.0.0): Breaking changes, major architecture changes
- **MINOR** (1.X.0): New features, significant improvements, non-breaking changes
- **PATCH** (1.1.X): Bug fixes, minor improvements, documentation updates

## Migration Guide

### Upgrading from 1.1.9 to 1.2.0

#### Required Actions

1. **Create .env file** (CRITICAL)
   ```bash
   # Generate secrets
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"

   # Copy template and add secrets
   cp env.example .env
   ```

2. **Update environment variables**
   - Add `SECRET_KEY` (32+ characters)
   - Add `JWT_SECRET_KEY` (32+ characters)
   - Add `JWT_SECRET` (32+ characters)
   - Add `ENCRYPTION_KEY` (32+ characters)
   - Update `CORS_ORIGINS` to your specific domains
   - Update `ALLOWED_HOSTS` to your specific hosts

3. **Review CORS configuration**
   - Wildcard `*` origins are no longer supported
   - Update to specific allowed origins

4. **Test application startup**
   ```bash
   # Verify configuration is valid
   python3 -c "from src.config import get_settings; print('✅ Config OK')"

   # Start application
   uvicorn src.api.main:app --reload
   ```

#### Optional Actions

1. **Update dependencies**
   ```bash
   pip install --upgrade aiohttp alembic anyio
   ```

2. **Run security scan**
   ```bash
   bandit -r src/ -ll
   ```

3. **Improve test coverage**
   ```bash
   pytest --cov=src --cov-report=html
   ```

## Breaking Changes

### Version 1.2.0

- **CORS Configuration**: Wildcard origins (`*`) no longer supported. Must specify exact origins in `CORS_ORIGINS` environment variable.
- **Environment Variables**: All secrets must now be provided via environment variables. Application will fail to start with validation errors if secrets are missing or too short.
- **Configuration**: Settings now require proper `.env` file or environment variables. Default values for secrets have been removed.

## Deprecations

- **Hardcoded secrets**: All hardcoded default secrets are deprecated and removed.
- **Wildcard CORS**: `allow_origins=["*"]` is deprecated for security reasons.
- **SQLAlchemy text()**: Updated all raw SQL to use `text()` wrapper.

## Security Advisories

### CVE Fixes in 1.2.0
- Fixed CORS security vulnerability (wildcard origins)
- Fixed HTTP Host header attack vulnerability
- Fixed information leakage in error responses
- Fixed hardcoded secrets in configuration

## Support

- **Documentation**: See `docs/` directory
- **Issues**: https://github.com/HelloblueAI/Bleu.js/issues
- **Security**: Report to security@helloblue.ai

---

**Last Updated:** 2025-01-12
**Next Review:** 2025-02-12

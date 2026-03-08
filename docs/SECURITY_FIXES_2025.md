# Security Fixes - February 2025 🔒

This document addresses all security vulnerabilities detected by GitHub Security Advisories and CodeQL.

---

## 🚨 Critical Vulnerabilities

### 1. Starlette DoS Vulnerability (High) - Issues #302, #303

**Affected Files:**

- `requirements.txt` - starlette==0.47.2
- `requirements-secure.txt` - starlette==0.47.2

**Issue:** O(n^2) DoS via Range header merging in `starlette.responses.FileResponse`

**Fix:**

- Update to starlette >= 0.48.0 (latest secure version)
- Check compatibility with FastAPI and uvicorn

**Action:**

```bash
# Update in requirements files
starlette>=0.48.0
```

---

### 2. python-ecdsa Timing Attack (High) - Issue #295

**Affected Files:**

- `pyproject.toml` - ecdsa = "^0.19.1"

**Issue:** Minerva timing attack on P-256 in python-ecdsa

**Fix:**

- Update to ecdsa >= 0.20.0
- Or remove if not directly used (use cryptography instead)

**Action:**

```bash
# Option 1: Update
ecdsa = "^0.20.0"

# Option 2: Remove (recommended if not directly used)
# Use cryptography library directly instead
```

---

### 3. Hugging Face Transformers ReDoS (Moderate) - Issues #292, #296, #297, #298

**Affected Files:**

- `requirements-minimal.txt` - transformers==4.52.4
- `requirements.txt` - transformers>=4.55.0

**Issues:**

- Regular Expression Denial of Service (ReDoS) vulnerabilities
- Multiple affected components (MarianTokenizer, AdamWeightDecay optimizer)

**Fix:**

- Update to transformers >= 4.55.0 (latest available as of Feb 2025)
- Note: Version 4.60.0 not yet released, using latest available
- Test compatibility with existing code

**Action:**

```bash
# Update in all requirements files
transformers>=4.55.0
```

---

### 4. Cryptography OpenSSL Vulnerability (Low) - Issue #299

**Affected Files:**

- `pyproject.toml` - cryptography = "^43.0.0"
- `requirements-secure.txt` - cryptography>=45.0.6 ✅ (already secure)

**Issue:** Vulnerable OpenSSL included in cryptography wheels

**Fix:**

- Update pyproject.toml to match requirements-secure.txt
- Use cryptography >= 45.0.6

**Action:**

```bash
# Update pyproject.toml
cryptography = "^45.0.6"
```

---

## 🔧 CodeQL Warnings

### JavaScript/TypeScript Syntax Errors

**Issue:** CodeQL found 103+ warnings about syntax errors in JS/TS files

**Likely Causes:**

- Files in `node_modules/` (should be excluded)
- Build artifacts
- Third-party dependencies

**Fix:**

1. Create/update `.github/codeql-config.yml` to exclude:
   - `node_modules/`
   - `build/`
   - `dist/`
   - `*.min.js`
   - Third-party libraries

2. Update CodeQL workflow to exclude these paths

---

## 📋 Action Plan

### Immediate (Today)

1. **Update Starlette**

   ```bash
   # Check latest version
   pip index versions starlette

   # Update to >= 0.48.0
   ```

2. **Update python-ecdsa**

   ```bash
   # Check if ecdsa is directly used
   grep -r "import ecdsa" src/
   grep -r "from ecdsa" src/

   # If not used, remove from pyproject.toml
   # If used, update to >= 0.20.0
   ```

3. **Update Transformers**

   ```bash
   # Update to >= 4.60.0
   ```

4. **Update Cryptography in pyproject.toml**
   ```bash
   # Match requirements-secure.txt version
   ```

### This Week

1. **Fix CodeQL Warnings**
   - Create `.github/codeql-config.yml`
   - Exclude unnecessary files
   - Update workflow

2. **Test All Updates**
   - Run full test suite
   - Check for breaking changes
   - Update documentation

3. **Create Security Update PR**
   - Update all dependency files
   - Add changelog entry
   - Document breaking changes (if any)

---

## 🔍 Dependency Audit

### Current Versions vs Secure Versions

| Package      | Current                | Secure    | Status                                     |
| ------------ | ---------------------- | --------- | ------------------------------------------ |
| starlette    | 0.48.0+ (requirements) | >= 0.48.0 | ✅ Updated                                 |
| ecdsa        | —                      | —         | ✅ Removed (use cryptography; Minerva CVE) |
| transformers | 4.55.0+ (requirements) | >= 4.55.0 | ✅ Updated                                 |
| cryptography | 46.0.5+ (pyproject)    | >= 45.0.6 | ✅ Updated                                 |

**Note:** ecdsa was removed from the project (see pyproject.toml). Starlette, transformers, and cryptography are pinned to secure versions in pyproject.toml and requirements files.

---

## 🧪 Testing After Updates

### Test Checklist

- [ ] Run full test suite: `pytest`
- [ ] Test API endpoints
- [ ] Test quantum features
- [ ] Test ML features
- [ ] Check for breaking changes
- [ ] Verify security fixes work
- [ ] Update CI/CD if needed

### Compatibility Testing

- [ ] FastAPI compatibility with new starlette
- [ ] Transformers model loading
- [ ] Cryptography encryption/decryption
- [ ] ECDSA usage (if kept)

---

## 📝 Files to Update

### Priority 1 (Critical)

- [ ] `pyproject.toml` - Update cryptography, ecdsa
- [ ] `requirements.txt` - Update starlette, transformers
- [ ] `requirements-secure.txt` - Update starlette, transformers
- [ ] `requirements-minimal.txt` - Update transformers

### Priority 2 (Important)

- [ ] `.github/codeql-config.yml` - Create/update
- [ ] `.github/workflows/codeql.yml` - Update if needed
- [ ] `CHANGELOG.md` - Document security fixes
- [ ] `docs/SECURITY.md` - Update security status

---

## 🚀 Implementation Steps

### Step 1: Update Dependencies

```bash
# 1. Update pyproject.toml
# 2. Update requirements.txt
# 3. Update requirements-secure.txt
# 4. Update requirements-minimal.txt
```

### Step 2: Test Locally

```bash
# Create fresh environment
python -m venv test-env
source test-env/bin/activate

# Install updated dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Test specific features
python -c "from bleujs import BleuJS; print('OK')"
```

### Step 3: Create PR

1. Create branch: `security/update-dependencies-2025`
2. Update all dependency files
3. Run tests
4. Update documentation
5. Create PR with security label

---

## 📊 Security Status

### Before Fixes

- **High:** 2 vulnerabilities
- **Moderate:** 4 vulnerabilities
- **Low:** 1 vulnerability
- **Total:** 7 vulnerabilities

### After Fixes (Expected)

- **High:** 0 vulnerabilities ✅
- **Moderate:** 0 vulnerabilities ✅
- **Low:** 0 vulnerabilities ✅
- **Total:** 0 vulnerabilities ✅

---

## Safety CLI scan (March 2026)

After running `./scripts/check-security.sh` with Safety authenticated, the following updates were applied where a fix exists:

| Package          | Change             | Note                                     |
| ---------------- | ------------------ | ---------------------------------------- |
| aiohttp          | ^3.12.14 → ^3.13.3 | 8 vulns fixed                            |
| python-multipart | ≥0.0.20 → ≥0.0.22  | CVE-2026-24486 path traversal            |
| torch            | ^2.7.1 → ^2.8.0    | CVE-2025-3730 (disputed)                 |
| starlette        | ≥0.48.0 → ≥0.49.1  | CVE-2025-62727 DoS (in requirements.txt) |
| cryptography     | already ≥46.0.5    | CVE-2026-26007                           |
| pillow           | already ≥12.1.1    | CVE-2026-25990                           |

**Fixed in this round:** keras (standalone) pinned to >=3.13.2; torch ^2.8.0 with Python >=3.11,<3.14 for triton compat.

**No known fix (accepted):** ray (4 vulns; required for distributed ML; no fix yet). **protobuf** (CVE-2026-0994): TensorFlow 2.19/2.20 is incompatible with protobuf 6.x; keep 5.x until TF supports 6.

**Apply fixes (regenerate lockfile):** From repo root run:

**Option A – with Poetry** (recommended so `poetry.lock` stays in sync):

```bash
# Prefer pipx so one Poetry is used (avoids apt + ~/.local version clash):
#   pipx install poetry
# If you use apt (python3-poetry) and get ImportError from poetry.core, remove user poetry:
#   pip uninstall poetry-core poetry -y   then use the apt poetry only.
poetry update aiohttp cryptography filelock starlette werkzeug pyasn1 virtualenv pillow python-multipart torch
# or update everything: poetry update
poetry install
```

**Option B – without Poetry** (upgrades only your current venv; `poetry.lock` unchanged):

```bash
source .venv/bin/activate   # or: . .venv/bin/activate   (Fish: source .venv/bin/activate.fish)
pip install -U "aiohttp>=3.13.3" "cryptography>=46.0.5" "filelock>=3.20.3" "starlette>=0.49.1" "werkzeug>=3.1.6" "pyasn1>=0.6.2" "virtualenv>=20.36.1" "pillow>=12.1.1" "python-multipart>=0.0.22" "torch>=2.8.0"
```

Then re-run `./scripts/check-security.sh`.

---

## 🔄 Ongoing Maintenance

### Weekly

- Check GitHub Security Advisories
- Review dependency updates
- Run **`./scripts/check-security.sh`** (runs pip-audit, optional safety, optional Trivy) or manually: `pip-audit`, `safety scan`

### Monthly

- Full dependency audit
- Update all dependencies
- Review security status

### Quarterly

- Security review
- Dependency cleanup
- Update security documentation

---

## 📚 Resources

- [GitHub Security Advisories](https://github.com/advisories)
- [PyPI Security](https://pypi.org/security/)
- [pip-audit](https://pypi.org/project/pip-audit/)
- [safety](https://pypi.org/project/safety/)

---

## ✅ Completion Checklist

- [ ] All dependencies updated
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Security advisories closed
- [ ] CodeQL warnings fixed
- [ ] PR created and merged
- [ ] Release notes updated

---

**Last Updated:** 2025-02-XX
**Status:** 🔴 In Progress
**Priority:** High

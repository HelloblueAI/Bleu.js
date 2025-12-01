# 🏢 Enterprise Practices - Quick Start

## What Big Companies Do (TL;DR)

### 1. **Use CI/CD** (Not Manual Uploads)
```bash
# Tag your release
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions automatically uploads to Hugging Face
```

### 2. **Version Your Models**
```bash
# Use semantic versioning
helloblueai/bleu-xgboost-classifier-v1.0.0
helloblueai/bleu-xgboost-classifier-v1.1.0
helloblueai/bleu-xgboost-classifier-latest
```

### 3. **Use Environments**
```bash
# Development
./scripts/enterprise_upload.sh dev

# Staging
./scripts/enterprise_upload.sh staging

# Production (requires confirmation)
./scripts/enterprise_upload.sh prod
```

### 4. **Store Tokens in Secrets** (Not .env files)
- GitHub: Settings → Secrets → Actions
- AWS: Secrets Manager
- Azure: Key Vault
- Never commit tokens to git

### 5. **Automate Everything**
- Model training → Auto upload
- Tests pass → Auto deploy
- Tag release → Auto version

## 🚀 Quick Setup

### Step 1: Add Token to GitHub Secrets
1. Go to: `Settings → Secrets and variables → Actions`
2. Click `New repository secret`
3. Name: `HF_TOKEN`
4. Value: Your Hugging Face token
5. Click `Add secret`

### Step 2: Use the Enterprise Script
```bash
# Development
./scripts/enterprise_upload.sh dev bleu-xgboost-classifier v1.0.0

# Production
./scripts/enterprise_upload.sh prod bleu-xgboost-classifier v1.0.0
```

### Step 3: Use GitHub Actions (Automatic)
```bash
# Just tag your release
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions uploads automatically!
```

## 📋 Enterprise Checklist

- [ ] Token stored in secrets (not .env)
- [ ] CI/CD pipeline set up
- [ ] Model versioning strategy
- [ ] Environment separation (dev/staging/prod)
- [ ] Automated testing before upload
- [ ] Model cards for all models
- [ ] Monitoring and alerting
- [ ] Access control and permissions

## 🔗 Full Guide

See `docs/ENTERPRISE_HF_PRACTICES.md` for complete details.

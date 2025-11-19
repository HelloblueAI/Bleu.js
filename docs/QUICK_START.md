# 🚀 Quick Start Guide - Bleu.js

## ⚡ Get Running in 5 Minutes

### Step 1: Generate Secrets (1 min)
```bash
# Generate all required secrets at once
python3 << 'EOF'
import secrets
print("# Add these to your .env file:")
print(f"SECRET_KEY={secrets.token_urlsafe(32)}")
print(f"JWT_SECRET_KEY={secrets.token_urlsafe(32)}")
print(f"JWT_SECRET={secrets.token_urlsafe(32)}")
print(f"ENCRYPTION_KEY={secrets.token_urlsafe(32)}")
print(f"DB_PASSWORD={secrets.token_urlsafe(16)}")
EOF
```

### Step 2: Create .env File (1 min)
```bash
# Copy the secrets above and create .env
cat > .env << 'EOF'
SECRET_KEY=your-generated-secret-key
JWT_SECRET_KEY=your-generated-jwt-secret-key
JWT_SECRET=your-generated-jwt-secret
ENCRYPTION_KEY=your-generated-encryption-key
DB_PASSWORD=your-generated-db-password

# Database
DATABASE_URL=sqlite:///./bleujs.db

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ALLOWED_HOSTS=localhost,127.0.0.1,::1

# Environment
APP_ENV=development
DEBUG=false
EOF
```

### Step 3: Install Dependencies (2 min)
```bash
pip install -r requirements.txt
```

### Step 4: Initialize Database (30 sec)
```bash
alembic upgrade head
```

### Step 5: Start Application (30 sec)
```bash
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 6: Test It! (30 sec)
```bash
# In another terminal
curl http://localhost:8000/health | jq
```

---

## ✅ Verification Checklist

- [ ] Application starts without errors
- [ ] Health check returns `{"status": "healthy"}`
- [ ] No security warnings in logs
- [ ] Database connection works
- [ ] API documentation loads at http://localhost:8000/docs

---

## 🎯 What's Next?

1. **Add your business logic** to `src/api/`
2. **Run tests:** `pytest --cov=src`
3. **Check security:** `bandit -r src/`
4. **Deploy to production** using the deployment guide

---

## 📚 Resources

- **Full Status Report:** `PROJECT_STATUS_REPORT.md`
- **Security Guide:** `docs/SECURITY_IMPROVEMENTS.md`
- **Environment Template:** `env.example`
- **API Docs:** http://localhost:8000/docs

---

## 🆘 Troubleshooting

**Port already in use?**
```bash
uvicorn src.api.main:app --reload --port 8001
```

**Dependencies not installing?**
```bash
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

**Database errors?**
```bash
rm bleujs.db  # Reset SQLite database
alembic upgrade head
```

---

**You're all set! Happy coding! 🎉**

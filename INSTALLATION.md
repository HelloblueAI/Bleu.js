# 📦 Bleu.js Installation Guide

## 🚀 Quick Installation (Recommended)

### Using pip (Simplest)

```bash
# Install latest version
pip install git+https://github.com/HelloblueAI/Bleu.js.git@v1.2.0

# Or install from source
pip install git+https://github.com/HelloblueAI/Bleu.js.git
```

### Using Poetry (Recommended for Development)

```bash
# Clone the repository
git clone https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js

# Install with Poetry
poetry install

# Activate the environment
poetry shell
```

### Using pip from Source

```bash
# Clone the repository
git clone https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js

# Install in development mode
pip install -e .

# Or install with all dependencies
pip install -r requirements.txt
```

---

## 📋 Prerequisites

### Required
- **Python 3.10+** (3.10, 3.11, or 3.12)
- **pip 21.0+**
- **Git**

### Optional
- **Poetry 1.0+** (for dependency management)
- **PostgreSQL 12+** (for production database)
- **Redis 6+** (for caching and rate limiting)
- **CUDA 11.8+** (for GPU acceleration)

### Check Your Setup

```bash
# Check Python version
python3 --version  # Should be 3.10+

# Check pip version
pip3 --version  # Should be 21.0+

# Check Poetry (if using)
poetry --version  # Should be 1.0+
```

---

## 🔧 Installation Methods

### Method 1: Quick Install (For Users)

**Best for:** Users who want to use Bleu.js quickly

```bash
# Install directly from GitHub
pip install git+https://github.com/HelloblueAI/Bleu.js.git@v1.2.0

# Verify installation
python3 -c "import bleujs; print('✅ Bleu.js installed!')"
```

---

### Method 2: Development Install (For Contributors)

**Best for:** Developers who want to contribute

```bash
# 1. Clone the repository
git clone https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js

# 2. Install with Poetry (recommended)
poetry install --with dev

# 3. Activate virtual environment
poetry shell

# 4. Verify installation
python3 -c "from src.config import get_settings; print('✅ Bleu.js ready!')"
```

---

### Method 3: Production Install (For Deployment)

**Best for:** Production servers

```bash
# 1. Clone the repository
git clone https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install production dependencies
pip install -r requirements.txt

# 4. Set up environment
cp env.example .env
# Edit .env with your production settings

# 5. Initialize database
alembic upgrade head

# 6. Start application
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

### Method 4: Docker Install (For Containers)

**Best for:** Containerized deployments

```bash
# Build Docker image
docker build -t bleujs:1.2.0 .

# Run container
docker run -d \
  -p 8000:8000 \
  -e SECRET_KEY=your-secret-key \
  -e DATABASE_URL=postgresql://user:pass@host/db \
  --name bleujs \
  bleujs:1.2.0

# Verify
curl http://localhost:8000/health
```

---

## ⚙️ Configuration

### 1. Generate Secrets (REQUIRED)

```bash
# Generate strong secrets (run this 4 times)
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Create .env File

```bash
# Copy template
cp env.example .env

# Edit with your secrets
nano .env
```

**Required Variables:**
```bash
# Critical Security (REQUIRED)
SECRET_KEY=your-generated-secret-key-here
JWT_SECRET_KEY=your-generated-jwt-secret-key-here
JWT_SECRET=your-generated-jwt-secret-here
ENCRYPTION_KEY=your-generated-encryption-key-here

# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@localhost:5432/bleujs
DB_PASSWORD=your-database-password

# Security (REQUIRED)
CORS_ORIGINS=https://yourdomain.com
ALLOWED_HOSTS=yourdomain.com

# Optional but Recommended
REDIS_URL=redis://localhost:6379/0
APP_ENV=production
```

### 3. Initialize Database

```bash
# Run migrations
alembic upgrade head

# Verify database connection
python3 -c "from src.database import check_db_connection; print('✅ DB OK' if check_db_connection() else '❌ DB Failed')"
```

---

## 🧪 Verify Installation

### Test 1: Import Package

```bash
python3 << 'EOF'
# Test basic import
import bleujs
print("✅ Bleu.js imported successfully")

# Test configuration
from src.config import get_settings
settings = get_settings()
print("✅ Configuration loaded")

# Test database
from src.database import check_db_connection
if check_db_connection():
    print("✅ Database connected")
else:
    print("⚠️  Database not configured (optional)")
EOF
```

### Test 2: Start Application

```bash
# Start development server
uvicorn src.api.main:app --reload

# Should see:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# INFO:     Application startup complete
```

### Test 3: Health Check

```bash
# In another terminal
curl http://localhost:8000/health

# Should return:
# {"status": "healthy", ...}
```

### Test 4: API Documentation

Open in browser:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 🎯 Installation Scenarios

### Scenario 1: Just Want to Try It

```bash
# Quick install
pip install git+https://github.com/HelloblueAI/Bleu.js.git

# Generate secrets
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Create minimal .env
echo "SECRET_KEY=your-generated-secret" > .env
echo "JWT_SECRET_KEY=your-generated-secret" >> .env
echo "JWT_SECRET=your-generated-secret" >> .env
echo "ENCRYPTION_KEY=your-generated-secret" >> .env
echo "DATABASE_URL=sqlite:///./bleujs.db" >> .env

# Start
uvicorn src.api.main:app --reload
```

### Scenario 2: Local Development

```bash
# Clone and setup
git clone https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js
poetry install --with dev
poetry shell

# Setup environment
cp env.example .env
# Edit .env with your settings

# Initialize database
alembic upgrade head

# Run tests
pytest

# Start development server
uvicorn src.api.main:app --reload --port 8000
```

### Scenario 3: Production Deployment

```bash
# Clone specific version
git clone --branch v1.2.0 https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js

# Setup production environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure for production
cp env.example .env
# Set production secrets and DATABASE_URL

# Initialize database
alembic upgrade head

# Run with multiple workers
uvicorn src.api.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --log-level info
```

### Scenario 4: Docker Deployment

```bash
# Build image
docker build -t bleujs:1.2.0 .

# Run with environment file
docker run -d \
  -p 8000:8000 \
  --env-file .env \
  --name bleujs-api \
  bleujs:1.2.0

# Check logs
docker logs bleujs-api

# Check health
curl http://localhost:8000/health
```

---

## 🐍 Python Version Support

| Python Version | Supported | Recommended |
|----------------|-----------|-------------|
| 3.8 | ⚠️ Legacy | No |
| 3.9 | ⚠️ Legacy | No |
| 3.10 | ✅ Yes | ✅ Yes |
| 3.11 | ✅ Yes | ✅ Yes |
| 3.12 | ✅ Yes | ✅ Yes |
| 3.13 | ⏳ Coming | No |

**Recommended:** Python 3.10 or 3.11

---

## 🔧 Platform-Specific Instructions

### Ubuntu/Debian

```bash
# Install Python and dependencies
sudo apt update
sudo apt install python3.10 python3-pip python3-venv git

# Install Bleu.js
git clone https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### macOS

```bash
# Install Python (if not installed)
brew install python@3.10

# Install Bleu.js
git clone https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Windows

```powershell
# Install Python from python.org first

# Clone repository
git clone https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## 🎓 Post-Installation

### 1. Configure Environment

```bash
# Copy template
cp env.example .env

# Generate secrets
python3 << 'EOF'
import secrets
print("\n# Add these to your .env file:")
print(f"SECRET_KEY={secrets.token_urlsafe(32)}")
print(f"JWT_SECRET_KEY={secrets.token_urlsafe(32)}")
print(f"JWT_SECRET={secrets.token_urlsafe(32)}")
print(f"ENCRYPTION_KEY={secrets.token_urlsafe(32)}")
EOF

# Edit .env and add the generated secrets
```

### 2. Initialize Database

```bash
# Run migrations
alembic upgrade head

# Verify
python3 -c "from src.database import check_db_connection; print('✅' if check_db_connection() else '❌')"
```

### 3. Start Application

```bash
# Development mode
uvicorn src.api.main:app --reload

# Production mode
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. Verify Installation

```bash
# Check health endpoint
curl http://localhost:8000/health

# View API documentation
open http://localhost:8000/docs
```

---

## 🆘 Troubleshooting

### Issue: Poetry install fails

```bash
# Update Poetry
curl -sSL https://install.python-poetry.org | python3 -

# Clear cache and retry
poetry cache clear pypi --all
poetry install --no-interaction
```

### Issue: Dependencies conflict

```bash
# Use pip instead
pip install -r requirements.txt
```

### Issue: Import errors

```bash
# Ensure you're in the right directory
cd /path/to/Bleu.js

# Ensure virtual environment is activated
source venv/bin/activate  # or poetry shell

# Reinstall
pip install -e .
```

### Issue: Database connection fails

```bash
# Check DATABASE_URL in .env
grep DATABASE_URL .env

# For SQLite (development)
echo "DATABASE_URL=sqlite:///./bleujs.db" >> .env

# For PostgreSQL (production)
echo "DATABASE_URL=postgresql://user:pass@localhost/bleujs" >> .env
```

### Issue: Application won't start

```bash
# Check Python version
python3 --version  # Must be 3.10+

# Check environment variables
python3 -c "from src.config import get_settings; print(get_settings())"

# Check for missing secrets
grep -E "SECRET_KEY|JWT_SECRET" .env
```

---

## 📊 Installation Verification Checklist

After installation, verify:

- [ ] Python 3.10+ installed
- [ ] Dependencies installed successfully
- [ ] .env file created with secrets
- [ ] Database initialized (if using PostgreSQL)
- [ ] Application starts without errors
- [ ] Health check returns `{"status": "healthy"}`
- [ ] API documentation accessible at /docs
- [ ] No error messages in logs

---

## 🔒 Security Note

**⚠️ IMPORTANT:** Never commit your `.env` file to version control!

```bash
# Verify .env is in .gitignore
grep "\.env" .gitignore

# Should show: .env
```

---

## 📦 Installation Options Comparison

| Method | Speed | Use Case | Difficulty |
|--------|-------|----------|------------|
| pip from GitHub | ⚡ Fast | Quick testing | ⭐ Easy |
| Poetry | 🐢 Slower | Development | ⭐⭐ Medium |
| pip from source | ⚡ Fast | Production | ⭐ Easy |
| Docker | 🐢 Slower | Container deployment | ⭐⭐⭐ Advanced |

---

## 🚀 Quick Start After Installation

```bash
# 1. Generate secrets
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# 2. Create .env with the generated secret
cat > .env << 'EOF'
SECRET_KEY=paste-your-generated-secret-here
JWT_SECRET_KEY=paste-another-secret-here
JWT_SECRET=paste-another-secret-here
ENCRYPTION_KEY=paste-another-secret-here
DATABASE_URL=sqlite:///./bleujs.db
CORS_ORIGINS=http://localhost:3000
ALLOWED_HOSTS=localhost,127.0.0.1
EOF

# 3. Start the application
uvicorn src.api.main:app --reload

# 4. Test it
curl http://localhost:8000/health
```

**✅ Done! Your Bleu.js installation is ready!**

---

## 📚 Next Steps

After successful installation:

1. **Read Quick Start:** See `QUICK_START.md`
2. **Configure:** Review `env.example` for all options
3. **Explore API:** Visit http://localhost:8000/docs
4. **Run Tests:** `pytest --cov=src`
5. **Read Docs:** Check `docs/` directory

---

## 💡 Pro Tips

### For Development

```bash
# Install with all dev tools
poetry install --with dev

# Enable auto-reload
uvicorn src.api.main:app --reload --log-level debug
```

### For Production

```bash
# Use production WSGI server
pip install gunicorn
gunicorn src.api.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Or use supervisor/systemd for process management
```

### For GPU Support

```bash
# Install PyTorch with CUDA
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Verify GPU
python3 -c "import torch; print('GPU:', torch.cuda.is_available())"
```

---

## 🌐 Where to Install

### Development
- ✅ Your local machine
- ✅ Development server
- ✅ Virtual machine

### Production
- ✅ AWS EC2, ECS, Lambda
- ✅ Google Cloud Platform
- ✅ Azure VMs
- ✅ DigitalOcean Droplets
- ✅ Your own servers

---

## 📞 Need Help?

### Installation Issues
- **GitHub Issues:** https://github.com/HelloblueAI/Bleu.js/issues
- **Discussions:** https://github.com/HelloblueAI/Bleu.js/discussions

### Documentation
- **Quick Start:** `QUICK_START.md`
- **Configuration:** `env.example`
- **API Docs:** http://localhost:8000/docs

### Community
- **Discord:** [Your Discord link]
- **Slack:** [Your Slack link]
- **Email:** support@helloblue.ai

---

## 🎉 You're All Set!

Bleu.js is now installed and ready to use. Start building amazing AI/ML applications with quantum computing capabilities!

**Happy coding!** 🚀

---

**Version:** 1.2.0
**Last Updated:** 2025-01-12
**License:** MIT

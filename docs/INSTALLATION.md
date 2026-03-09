# 📦 Bleu.js Installation Guide

## For most users: Cloud API + CLI (recommended)

If you only need the **SDK and CLI** to call the Bleu.js API at [bleujs.org](https://bleujs.org):

1. **Install:** `pip install bleu-js` (Python 3.11+)
2. **Get an API key** at [bleujs.org](https://bleujs.org)
3. **Set key:** `export BLEUJS_API_KEY=bleujs_sk_...` or `bleu config set api-key bleujs_sk_...`
4. **Run:** `bleu chat "Hello"` or use the SDK in Python

**Full walkthrough:** [Get started](GET_STARTED.md). No `.env`, database, or server setup required.

---

## Self-hosting and development

The sections below cover **running the Bleu.js app yourself** (API server, dashboard) or **developing/contributing** (clone, Poetry, tests). For that you need a `.env` file and optional database; see [SECURITY.md](../SECURITY.md) and [`.env.example`](../.env.example).

---

## 🚀 Quick Installation (pip)

### Using pip from PyPI (Simplest)

**Fast install** — minimal deps, API + CLI (small download):

```bash
pip install bleu-js
```

Add extras only when needed: `[ml]`, `[quantum]`, `[deep]`, or `[all]` for the full stack.

### Using pip from Git

```bash
# Install latest from GitHub
pip install git+https://github.com/HelloblueAI/Bleu.js.git
```

### Using Poetry (Recommended for Development)

**What to use from now on:** If `poetry` fails on your machine, use Poetry via pipx: `pipx run poetry install --extras all`, etc. See [Poetry: what to use from now on](POETRY_FIX.md).

```bash
# Clone the repository
git clone https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js

# Install with all extras (needed for tests and running the app)
poetry install --extras all
# If poetry is broken: pipx run poetry install --no-interaction --extras all

# Activate the environment
poetry shell
```

### Using pip from Source

**For development or self-hosting only.** Most users should use `pip install bleu-js` from PyPI.

```bash
# Clone the repository
git clone https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js

# Install the package (API + CLI, same as PyPI)
pip install -e .

# Or install with full app dependencies (for running the server)
pip install -e ".[server]"
# requirements.txt is used by CI/full stack; prefer pyproject.toml extras.
```

---

## 📋 Prerequisites

### Required

- **Python 3.11+** (3.11, 3.12, or 3.13)
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
python3 --version  # Should be 3.11+

# Check pip version
pip3 --version  # Should be 21.0+

# Check Poetry (if using)
poetry --version  # Should be 1.0+
```

---

## 🔧 Installation Methods

### Method 1: Quick Install (For Users – Cloud API)

**Best for:** Users who want to use the Bleu.js cloud API and CLI

```bash
# Install from PyPI (recommended)
pip install bleu-js

# Verify installation
python3 -c "import bleujs; print('✅ Bleu.js installed! Version:', bleujs.__version__)"

# Set API key and try CLI (get key at https://bleujs.org)
bleu config set api-key bleujs_sk_your_key
bleu chat "Hello"
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
cp .env.example .env
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
cp .env.example .env

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

### Test 1: Import Package (pip users)

```bash
# If you installed with: pip install bleu-js
python3 -c "import bleujs; print('✅ Bleu.js', bleujs.__version__)"
bleu version
bleu health   # requires BLEUJS_API_KEY
```

### Test 1b: Import Package (self-host / from source)

```bash
# If you cloned the repo and run the app locally
python3 -c "import bleujs; print('✅ Bleu.js imported')"
python3 -c "from src.config import get_settings; print('✅ Config loaded')"
# Optional: from src.database import check_db_connection; print('✅ DB' if check_db_connection() else '⚠️ DB not configured')"
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
cp .env.example .env
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
git clone --branch v1.2.1 https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js

# Setup production environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure for production
cp .env.example .env
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
| -------------- | --------- | ----------- |
| 3.11           | ✅ Yes    | ✅ Yes      |
| 3.12           | ✅ Yes    | ✅ Yes      |
| 3.13           | ✅ Yes    | Yes         |

**Recommended:** Python 3.11 or 3.12

---

## 🔧 Platform-Specific Instructions

### Ubuntu/Debian

```bash
# Install Python and dependencies
sudo apt update
sudo apt install python3.11 python3-pip python3-venv git

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
brew install python@3.11

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
cp .env.example .env

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
python3 --version  # Must be 3.11+

# Check environment variables
python3 -c "from src.config import get_settings; print(get_settings())"

# Check for missing secrets
grep -E "SECRET_KEY|JWT_SECRET" .env
```

---

## 📊 Installation Verification Checklist

After installation, verify:

- [ ] Python 3.11+ installed
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

| Method          | Speed     | Use Case             | Difficulty      |
| --------------- | --------- | -------------------- | --------------- |
| pip from GitHub | ⚡ Fast   | Quick testing        | ⭐ Easy         |
| Poetry          | 🐢 Slower | Development          | ⭐⭐ Medium     |
| pip from source | ⚡ Fast   | Production           | ⭐ Easy         |
| Docker          | 🐢 Slower | Container deployment | ⭐⭐⭐ Advanced |

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

1. **Cloud API users:** [Get started](GET_STARTED.md) · [QUICKSTART](QUICKSTART.md)
2. **Self-host / dev:** Review [`.env.example`](../.env.example); run `uvicorn src.main:app --reload`
3. **Explore API (when app running):** http://localhost:8000/docs
4. **Run tests (contributors):** `pytest --cov=src`
5. **Docs:** `docs/` directory

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

- **Get started (cloud API):** [GET_STARTED.md](GET_STARTED.md)
- **Quick start:** [QUICKSTART.md](QUICKSTART.md)
- **Configuration (self-host):** [`.env.example`](../.env.example)
- **API docs (when app running):** http://localhost:8000/docs

### Community

- **Discord:** [Your Discord link]
- **Slack:** [Your Slack link]
- **Email:** support@helloblue.ai

---

## 🎉 You're All Set!

Bleu.js is now installed and ready to use. Start building amazing AI/ML applications with quantum computing capabilities!

**Happy coding!** 🚀

---

**Version:** See [pyproject.toml](../pyproject.toml) or `bleu version`. **License:** MIT

import os

from dotenv import load_dotenv

load_dotenv()

_ENV = os.getenv("ENV_NAME", "development").lower()
_DEFAULT_PASSWORD = "your_secure_db_password"
if _ENV in ("production", "staging") and os.getenv("DB_PASSWORD", "").strip() == "":
    raise ValueError("DB_PASSWORD must be set in production/staging")

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "your-rds-endpoint"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "bleu_js"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", _DEFAULT_PASSWORD),
}

# Create database URL
if os.getenv("TESTING") == "true":
    DATABASE_URL = "sqlite:///./test.db"
else:
    DATABASE_URL = (
        f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}"
        f"@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
    )


def get_database_url() -> str:
    """Return the configured database URL."""
    return DATABASE_URL

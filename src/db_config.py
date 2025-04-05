import os

from dotenv import load_dotenv

load_dotenv()

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "your-rds-endpoint"),  # Using RDS endpoint
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "bleu_js"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "your_secure_db_password"),
}

# Create database URL
if os.getenv("TESTING") == "true":
    DATABASE_URL = "sqlite:///./test.db"
else:
    DATABASE_URL = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"

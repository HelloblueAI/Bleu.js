import os
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

from db_config import DATABASE_URL

load_dotenv()


class Settings(BaseSettings):
    # Application Settings
    APP_NAME: str = "Bleu.js"
    VERSION: str = "1.1.4"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # AWS Settings
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-west-2")
    S3_BUCKET: str = os.getenv("S3_BUCKET", "bleujs-assets")

    # Database Settings
    DATABASE_URL: str = DATABASE_URL

    # JWT Settings
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Stripe Settings
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    # Product IDs
    CORE_PLAN_ID: str = os.getenv("CORE_PLAN_ID", "")
    ENTERPRISE_PLAN_ID: str = os.getenv("ENTERPRISE_PLAN_ID", "")

    # OAuth Settings
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    # Email Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "noreply@bleujs.com")

    # Rate Limiting
    RATE_LIMIT_CORE: int = 100  # requests per month for CORE plan
    RATE_LIMIT_ENTERPRISE: int = 5000  # requests per month for Enterprise plan

    # Cache Settings
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL")

    # Monitoring
    SENTRY_DSN: Optional[str] = os.getenv("SENTRY_DSN")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Security
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,https://bleujs.com"
    )
    ALLOWED_HOSTS: str = os.getenv("ALLOWED_HOSTS", "*")

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Using lru_cache to prevent multiple reads of environment variables.
    """
    return Settings()


# Create a global settings instance
settings = get_settings()

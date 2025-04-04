from datetime import datetime, timezone
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings


class TestSettings(BaseSettings):
    # Application Settings
    APP_NAME: str = "Bleu.js Test"
    VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Database Settings
    DATABASE_URL: str = "sqlite:///./test.db"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "test_db"
    DB_USER: str = "test_user"
    DB_PASSWORD: str = "test_password"

    # JWT Settings
    JWT_SECRET_KEY: str = "test_secret_key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Stripe Settings
    STRIPE_SECRET_KEY: str = "test_stripe_key"
    STRIPE_PUBLISHABLE_KEY: str = "test_stripe_publishable_key"
    STRIPE_WEBHOOK_SECRET: str = "test_webhook_secret"

    # Product IDs
    CORE_PLAN_ID: str = "test_core_plan"
    ENTERPRISE_PLAN_ID: str = "test_enterprise_plan"

    # Rate Limiting
    RATE_LIMIT_CORE: int = 100
    RATE_LIMIT_ENTERPRISE: int = 1000
    RATE_LIMIT_PERIOD: int = 3600  # 1 hour in seconds

    # Security
    CORS_ORIGINS: str = "http://localhost:3000"
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"

    # Testing
    TESTING: bool = True

    class Config:
        env_file = ".env.test"


@lru_cache()
def get_test_settings() -> TestSettings:
    return TestSettings() 
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, UTC, timedelta
from src.models.declarative_base import Base
from src.models.user import User
from src.models.subscription import Subscription, SubscriptionPlan, APIToken, PlanType
from src.models.customer import RateLimitToken
from src.models.rate_limit import RateLimit
from typing import List, Optional
from pydantic_settings import BaseSettings
from functools import lru_cache
from sqlalchemy.pool import StaticPool
from src.config import settings

# Test configuration constants
TEST_EMAIL = "test@example.com"
TEST_NOREPLY_EMAIL = "noreply@example.com"

# Test database URL
TEST_DATABASE_URL = settings.DATABASE_URL


class TestSettings(BaseSettings):
    # Application Settings
    APP_NAME: str = "Bleu.js Test"
    VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database Settings
    DATABASE_URL: str = "sqlite:///./test.db"

    # JWT Settings
    JWT_SECRET_KEY: str = "test-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Stripe Settings
    STRIPE_SECRET_KEY: str = "test_stripe_secret_key"
    STRIPE_PUBLISHABLE_KEY: str = "test_stripe_publishable_key"
    STRIPE_WEBHOOK_SECRET: str = "test_stripe_webhook_secret"

    # Product IDs
    CORE_PLAN_ID: str = "test_core_plan_id"
    ENTERPRISE_PLAN_ID: str = "test_enterprise_plan_id"

    # Rate Limiting
    RATE_LIMIT_CORE: int = 100
    RATE_LIMIT_ENTERPRISE: int = 5000

    # Security
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    ALLOWED_HOSTS: List[str] = ["*"]

    # Email Settings
    SMTP_HOST: str = "smtp.test.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = TEST_EMAIL
    SMTP_PASSWORD: str = "test_password"
    FROM_EMAIL: str = TEST_NOREPLY_EMAIL

    class Config:
        env_file = ".env.test"
        case_sensitive = True


@lru_cache()
def get_test_settings() -> TestSettings:
    return TestSettings()


class Settings:
    # Application Settings
    APP_NAME = "Bleu.js Test"
    VERSION = "1.0.0"
    DEBUG = True

    # Database Settings
    DATABASE_URL = "sqlite:///./test.db"

    # JWT Settings
    JWT_SECRET_KEY = "test-secret-key"
    JWT_ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

    # Security
    CORS_ORIGINS = ["http://localhost:3000"]
    ALLOWED_HOSTS = ["*"]

    # Rate Limiting
    RATE_LIMIT_CORE = 100
    RATE_LIMIT_ENTERPRISE = 5000

    # Email Settings
    SMTP_HOST = "smtp.test.com"
    SMTP_PORT = 587
    SMTP_USER = TEST_EMAIL
    SMTP_PASSWORD = "test_password"
    FROM_EMAIL = TEST_NOREPLY_EMAIL


settings = Settings()


@pytest.fixture(scope="session")
def engine():
    """Create a test database engine."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"timeout": 30, "check_same_thread": False},
        poolclass=StaticPool,
        isolation_level="SERIALIZABLE"
    )
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture(scope="function")
def db_session(engine):
    """Create a test database session."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def test_user(db_session):
    user = User(
        id="test-user-id",
        email="test@example.com",
        hashed_password="test-password",
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture(scope="function")
def test_subscription_plan(db_session):
    plan = SubscriptionPlan(
        id="test-plan-id",
        name="Test Plan",
        plan_type=PlanType.CORE,
        price=1000,
        api_calls_limit=100,
        trial_days=30,
        features={"core_ai_model_access": True},
        rate_limit=100,
        uptime_sla="99.9%",
        support_level="standard"
    )
    db_session.add(plan)
    db_session.commit()
    return plan


@pytest.fixture(scope="function")
def test_subscription(db_session, test_user, test_subscription_plan):
    subscription = Subscription(
        id="test-subscription-id",
        user_id=test_user.id,
        plan_id=test_subscription_plan.id,
        plan_type=PlanType.CORE,
        status="active",
        current_period_start=datetime.now(UTC),
        current_period_end=datetime.now(UTC) + timedelta(days=30),
    )
    db_session.add(subscription)
    db_session.commit()
    return subscription


@pytest.fixture(scope="function")
def test_api_token(db_session, test_user, test_subscription):
    token = APIToken(
        id="test-token-id",
        user_id=test_user.id,
        subscription_id=test_subscription.id,
        name="Test Token",
        token="test-token-value",
        is_active=True,
        created_at=datetime.now(UTC),
    )
    db_session.add(token)
    db_session.commit()
    return token


@pytest.fixture(scope="function")
def test_rate_limit(db_session, test_user):
    rate_limit = RateLimit(
        id="test-rate-limit-id",
        user_id=test_user.id,
        endpoint="test_endpoint",
        limit=100,
        period=3600,
        calls_count=0,
        last_reset=datetime.now(UTC),
        current_period_start=datetime.now(UTC),
        last_used=datetime.now(UTC)
    )
    db_session.add(rate_limit)
    db_session.commit()
    return rate_limit

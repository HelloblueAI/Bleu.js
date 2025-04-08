import os
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import List, Optional

import pytest
from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.config import get_settings
from src.models.customer import RateLimitToken
from src.models.declarative_base import Base
from src.models.rate_limit import RateLimit
from src.models.subscription import APIToken, PlanType, Subscription, SubscriptionPlan
from src.models.user import User

# Load environment variables
load_dotenv(".env.test")

# EC2 Configuration
EC2_HOST = "44.245.223.189"
EC2_USER = "ec2-user"
EC2_KEY_PATH = "bleu-js-key.pem"

# API Gateway Configuration
API_GATEWAY_URL = os.getenv("AWS_API_CONFIG_BASE_URL")
TEST_API_KEY = os.getenv("TEST_API_KEY")
ENTERPRISE_API_KEY = os.getenv("ENTERPRISE_TEST_API_KEY")
AWS_REGION = os.getenv("AWS_REGION")

# SSH Commands
SSH_BASE = f"ssh -i {EC2_KEY_PATH} {EC2_USER}@{EC2_HOST}"
SCP_BASE = f"scp -i {EC2_KEY_PATH}"

# Service check commands
SERVICE_COMMANDS = {
    "cloudwatch": "sudo systemctl status amazon-cloudwatch-agent",
    "nginx": "sudo systemctl status nginx",
}

# Log paths
LOG_PATHS = {
    "cloudwatch": "/var/log/amazon/amazon-cloudwatch-agent/amazon-cloudwatch-agent.log",
    "cloud_init": "/var/log/cloud-init-output.log",
}

# Test configuration constants
TEST_EMAIL = "test@example.com"
TEST_NOREPLY_EMAIL = "noreply@example.com"

# Test database URL
TEST_DATABASE_URL = get_settings().DATABASE_URL


class TestSettings(BaseSettings):
    # Application Settings
    APP_NAME: str = Field(default="Bleu.js Test")
    VERSION: str = Field(default="1.0.0")
    DEBUG: bool = Field(default=True)

    # Database Settings
    DATABASE_URL: str = Field(default="sqlite:///./test.db")

    # JWT Settings
    JWT_SECRET_KEY: str = Field(default="test-secret-key")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)

    # Stripe Settings
    STRIPE_SECRET_KEY: str = Field(default="test_stripe_secret_key")
    STRIPE_PUBLISHABLE_KEY: str = Field(default="test_stripe_publishable_key")
    STRIPE_WEBHOOK_SECRET: str = Field(default="test_stripe_webhook_secret")

    # Product IDs
    CORE_PLAN_ID: str = Field(default="test_core_plan_id")
    ENTERPRISE_PLAN_ID: str = Field(default="test_enterprise_plan_id")

    # Rate Limiting
    RATE_LIMIT_CORE: int = Field(default=100)
    RATE_LIMIT_ENTERPRISE: int = Field(default=5000)

    # Security
    CORS_ORIGINS: str = Field(default="http://localhost:3000")
    ALLOWED_HOSTS: str = Field(default="*")

    # Email Settings
    SMTP_HOST: str = Field(default="smtp.test.com")
    SMTP_PORT: int = Field(default=587)
    SMTP_USER: str = Field(default=TEST_EMAIL)
    SMTP_PASSWORD: str = Field(default="test_password")
    FROM_EMAIL: str = Field(default=TEST_NOREPLY_EMAIL)

    model_config = SettingsConfigDict(
        env_file=".env.test",
        case_sensitive=True,
        arbitrary_types_allowed=True,
        extra="allow",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def allowed_hosts_list(self) -> List[str]:
        """Get allowed hosts as a list."""
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",")]


@lru_cache()
def get_test_settings() -> TestSettings:
    return TestSettings()


# Use the test settings instance
test_settings = get_test_settings()


@pytest.fixture(scope="session")
def engine():
    """Create a test database engine."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"timeout": 30, "check_same_thread": False},
        poolclass=StaticPool,
        isolation_level="SERIALIZABLE",
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
        support_level="standard",
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
        current_period_start=datetime.now(timezone.utc),
        current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
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
        created_at=datetime.now(timezone.utc),
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
        last_reset=datetime.now(timezone.utc),
        current_period_start=datetime.now(timezone.utc),
        last_used=datetime.now(timezone.utc),
    )
    db_session.add(rate_limit)
    db_session.commit()
    return rate_limit

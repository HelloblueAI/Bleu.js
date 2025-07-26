import os
import uuid
from datetime import datetime, timezone

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.main import app
from src.models.customer import Customer
from src.models.declarative_base import Base
from src.models.subscription import APIToken, Subscription, SubscriptionPlan
from src.models.user import User
from src.schemas.user import UserCreate
from tests.test_config import get_test_settings

# Set testing environment and load test environment variables
os.environ["TESTING"] = "true"
load_dotenv(".env.test")


# Import test settings and models after setting TESTING=true

# Get test settings
settings = get_test_settings()

# Create test session factory
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False)


@pytest.fixture(scope="session")
def db_engine():
    """Create a database engine for the test session."""
    # Use a single database file for the entire test session
    db_url = "sqlite:///test_session.db"

    # Create engine
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    # Create all tables with error handling for existing indexes
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        # If tables already exist, that's fine
        print(f"Note: Some tables may already exist: {e}")

    yield engine

    # Clean up: dispose engine and remove file
    engine.dispose()
    try:
        os.remove("test_session.db")
    except FileNotFoundError:
        pass


@pytest.fixture(scope="function")
def db(db_engine):
    """Get a database session for testing."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db):
    """Get a test client with database session."""
    from src.database import get_db

    def override_get_db():
        try:
            yield db
        finally:
            pass  # Don't close the session here as it's managed by the db fixture

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def clean_db(db):
    # Clean up all tables
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()


@pytest.fixture
def test_customer(db):
    """Create a test customer."""
    customer = Customer(
        stripe_customer_id="test_stripe_customer_id",
        email="test@example.com",
        api_key="test_api_key",
        plan="core",
        features=["api_access"],
        rate_limit=100,
        subscription_start=datetime.now(timezone.utc),
        subscription_end=datetime.now(timezone.utc).replace(
            year=datetime.now(timezone.utc).year + 1
        ),
        is_active=True,
    )
    db.add(customer)
    db.commit()
    return customer


@pytest.fixture
def db_session(db):
    """Alias for db fixture to match test expectations."""
    return db


@pytest.fixture
def test_user(db):
    """Create a test user."""
    user = User(
        email="test@example.com",
        hashed_password="test_hashed_password",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_subscription(db, test_user):
    """Create a test subscription."""
    # Create a subscription plan first
    plan = SubscriptionPlan(
        id=str(uuid.uuid4()),
        name="Test Plan",
        plan_type="premium",
        price=1000,
        api_calls_limit=1000,
        features='{"api_access": true, "advanced_analytics": true}',
    )
    db.add(plan)
    db.commit()

    subscription = Subscription(
        user_id=test_user.id,
        plan_id=plan.id,
        status="active",
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc).replace(
            year=datetime.now(timezone.utc).year + 1
        ),
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


@pytest.fixture
def test_api_token(db, test_user):
    """Create a test API token."""
    token = APIToken(
        user_id=test_user.id,
        name="Test API Token",
        token_hash="test_token_123456789",
        is_active="active",
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token

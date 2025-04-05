import os
from datetime import datetime, timezone

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set testing environment and load test environment variables
os.environ["TESTING"] = "true"
load_dotenv(".env.test")

from src.main import app
from src.models.customer import Customer
from src.models.declarative_base import Base

# Import test settings and models after setting TESTING=true
from tests.test_config import get_test_settings

# Get test settings
settings = get_test_settings()

# Create test database engine - always use SQLite for testing
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Create test session factory
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_engine():
    """Create and drop database schema for each test."""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


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

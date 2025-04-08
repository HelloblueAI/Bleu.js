import asyncio
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.database import get_db
from src.main import app
from src.models.subscription import (
    APIToken,
    APITokenCreate,
    Subscription,
    SubscriptionPlan,
)
from src.models.user import User
from src.services import init_services
from src.services.api_token_service import APITokenService
from src.services.auth_service import AuthService

client = TestClient(app)


@pytest.fixture
def services(db: Session):
    return init_services(db)


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user with an active subscription."""
    user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        hashed_password="hashed_password",
        full_name="Test User",
        is_active=True,
        is_verified=True,
        trial_end_date=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create a subscription plan first
    plan = SubscriptionPlan(
        id=str(uuid.uuid4()),
        name="Test Plan",
        plan_type="CORE",
        price=1000,
        api_calls_limit=100,
        rate_limit=1000,
        uptime_sla="99.9",
        support_level="standard",
        features={"core_ai_model_access": True},
        trial_days=30,
    )
    db.add(plan)
    db.commit()

    subscription = Subscription(
        id=str(uuid.uuid4()),
        user_id=user.id,
        plan_id=plan.id,
        plan_type="CORE",
        status="active",
        current_period_start=datetime.now(timezone.utc),
        current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(subscription)
    db.commit()

    return user


@pytest.fixture
def test_subscription(db: Session, test_user: User):
    plan = SubscriptionPlan(
        id="test_plan_id",
        name="Test Plan",
        plan_type="CORE",
        price=1000,
        api_calls_limit=100,
        rate_limit=1000,
        uptime_sla=99.9,
        support_level="standard",
        features={"core_ai_model_access": True},
    )
    db.add(plan)
    db.commit()

    subscription = Subscription(
        id="test_subscription_id",
        user_id=test_user.id,
        plan_id=plan.id,
        plan_type="CORE",
        status="active",
        current_period_start=datetime.now(timezone.utc),
        current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(subscription)
    db.commit()
    return subscription


@pytest.fixture
def test_token(db: Session, test_user: User) -> APIToken:
    """Create a test API token."""
    token = APIToken(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        subscription_id=test_user.subscription.id,
        name="Test Token",
        token=secrets.token_urlsafe(32),
        is_active=True,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


@pytest.fixture
def auth_headers(test_user: User, db: Session) -> dict:
    """Create authentication headers for test user."""
    auth_service = AuthService(db)
    access_token = auth_service.create_access_token({"sub": test_user.email})
    return {"Authorization": f"Bearer {access_token}"}


async def test_create_token(client: TestClient, test_user: User, auth_headers: dict):
    """Test creating a new API token."""
    response = client.post(
        "/api/v1/tokens",
        json={"name": "New Token"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Token"
    assert data["user_id"] == test_user.id
    assert data["is_active"] is True


async def test_create_token_without_subscription(
    client: TestClient, db: Session, auth_headers: dict
):
    """Test creating a token without an active subscription."""
    user = User(
        id=str(uuid.uuid4()),
        email="no_sub@example.com",
        hashed_password="hashed_password",
        full_name="No Subscription User",
        is_active=True,
        is_verified=True,
        trial_end_date=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(user)
    db.commit()

    auth_service = AuthService(db)
    access_token = auth_service.create_access_token({"sub": user.email})
    headers = {"Authorization": f"Bearer {access_token}"}

    response = client.post(
        "/api/v1/tokens",
        json={"name": "New Token"},
        headers=headers,
    )
    assert response.status_code == 403


async def test_get_tokens(
    client: TestClient, test_user: User, test_token: APIToken, auth_headers: dict
):
    """Test getting all user's API tokens."""
    response = client.get("/api/v1/tokens", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == test_token.id


async def test_revoke_token(
    client: TestClient, test_user: User, test_token: APIToken, auth_headers: dict
):
    """Test revoking an API token."""
    response = client.post(
        f"/api/v1/tokens/{test_token.id}/revoke",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_token.id
    assert data["is_active"] is False


async def test_rotate_token(
    client: TestClient, test_user: User, test_token: APIToken, auth_headers: dict
):
    """Test rotating an API token."""
    old_token = test_token.token
    response = client.post(
        f"/api/v1/tokens/{test_token.id}/rotate",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_token.id
    assert data["token"] != old_token


async def test_validate_token(db: Session, test_token: APIToken):
    """Test validating an API token."""
    token_service = APITokenService(db)
    result = await token_service.validate_token(test_token.token)
    assert result is True

    # Test invalid token
    result = await token_service.validate_token("invalid_token")
    assert result is False


async def test_validate_expired_token(db: Session):
    """Test validating an expired token."""
    # Create a test user with subscription
    user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        hashed_password="hashed_password",
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.commit()

    # Create a subscription plan
    plan = SubscriptionPlan(
        id=str(uuid.uuid4()),
        name="Test Plan",
        plan_type="CORE",
        price=1000,
        api_calls_limit=100,
        rate_limit=1000,
        uptime_sla="99.9",
        support_level="standard",
        features={"core_ai_model_access": True},
        trial_days=30,
    )
    db.add(plan)
    db.commit()

    # Create a subscription
    subscription = Subscription(
        id=str(uuid.uuid4()),
        user_id=user.id,
        plan_id=plan.id,
        plan_type="CORE",
        status="active",
        current_period_start=datetime.now(timezone.utc),
        current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(subscription)
    db.commit()

    # Create an expired token
    token = APIToken(
        id=str(uuid.uuid4()),
        user_id=user.id,
        subscription_id=subscription.id,
        name="Expired Token",
        token=secrets.token_urlsafe(32),
        is_active=True,
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    db.add(token)
    db.commit()

    # Test validation
    token_service = APITokenService(db)
    result = await token_service.validate_token(token.token)
    assert result is False


@pytest.mark.asyncio
async def test_create_api_token(services: dict, test_user: User):
    """Test creating an API token using the service directly."""
    token_data = APITokenCreate(name="Service Token")
    token = await services["api_token_service"].create_token(test_user, token_data)
    assert token.name == "Service Token"
    assert token.user_id == test_user.id
    assert token.is_active is True


@pytest.mark.asyncio
async def test_create_api_token_without_subscription(services: dict, db: Session):
    """Test creating a token without subscription using the service directly."""
    user = User(
        id=str(uuid.uuid4()),
        email="no_sub_service@example.com",
        hashed_password="hashed_password",
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.commit()

    token_data = APITokenCreate(name="No Sub Token")
    with pytest.raises(HTTPException) as exc_info:
        await services["api_token_service"].create_token(user, token_data)
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_get_user_tokens(services: dict, test_user: User, test_token: APIToken):
    """Test getting user tokens using the service directly."""
    tokens = await services["api_token_service"].get_user_tokens(test_user)
    assert len(tokens) == 1
    assert tokens[0].id == test_token.id


@pytest.mark.asyncio
async def test_revoke_api_token(services: dict, test_user: User, test_token: APIToken):
    """Test revoking a token using the service directly."""
    result = await services["api_token_service"].revoke_token(test_token.id, test_user)
    assert result.id == test_token.id
    assert result.is_active is False


@pytest.mark.asyncio
async def test_revoke_nonexistent_token(services: dict, test_user: User):
    """Test revoking a non-existent token using the service directly."""
    with pytest.raises(HTTPException) as exc_info:
        await services["api_token_service"].revoke_token("nonexistent", test_user)
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_rotate_api_token(services: dict, test_user: User, test_token: APIToken):
    """Test rotating a token using the service directly."""
    old_token = test_token.token
    new_token = await services["api_token_service"].rotate_token(
        test_token.id, test_user
    )
    assert new_token.id == test_token.id
    assert new_token.token != old_token


@pytest.mark.asyncio
async def test_create_multiple_tokens(services: dict, test_user: User):
    """Test creating multiple tokens for the same user."""
    token_data1 = APITokenCreate(name="Token 1")
    token_data2 = APITokenCreate(name="Token 2")

    token1 = await services["api_token_service"].create_token(test_user, token_data1)
    token2 = await services["api_token_service"].create_token(test_user, token_data2)

    assert token1.name == "Token 1"
    assert token2.name == "Token 2"
    assert token1.token != token2.token


@pytest.mark.asyncio
async def test_token_expiration(services: dict, test_user: User):
    """Test token expiration."""
    token_data = APITokenCreate(
        name="Expiring Token",
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )

    token = await services["api_token_service"].create_token(test_user, token_data)
    assert token.name == "Expiring Token"
    assert token.expires_at is not None

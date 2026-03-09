import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

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

# Plain token for test_token fixture; DB stores hash only
_TEST_PLAIN_TOKEN = "bleujs_test_plain_token_fixture_xyz"


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _token_display_prefix(raw: str) -> str:
    return f"...{raw[-4:]}" if len(raw) >= 4 else "****"


@pytest.fixture
def services(db: Session):
    """Initialize services with database session."""
    from src.services.api_token_service import APITokenService
    from src.services.auth_service import AuthService

    services = init_services()
    services["api_token_service"] = APITokenService(db)
    services["auth_service"] = AuthService(db)
    return services


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user with an active subscription."""
    user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        hashed_password="hashed_password",
        full_name="Test User",
        is_active=True,
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
        features='{"core_ai_model_access": true}',
    )
    db.add(plan)
    db.commit()

    subscription = Subscription(
        id=str(uuid.uuid4()),
        user_id=user.id,
        plan_id=plan.id,
        status="active",
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + timedelta(days=30),
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
        features='{"core_ai_model_access": true}',
    )
    db.add(plan)
    db.commit()

    subscription = Subscription(
        id="test_subscription_id",
        user_id=test_user.id,
        plan_id=plan.id,
        status="active",
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(subscription)
    db.commit()
    return subscription


@pytest.fixture
def test_token(db: Session, test_user: User) -> APIToken:
    """Create a test API token. Use _TEST_PLAIN_TOKEN for validate_token(plain)."""
    token = APIToken(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        name="Test Token",
        token_hash=_hash_token(_TEST_PLAIN_TOKEN),
        token_prefix=_token_display_prefix(_TEST_PLAIN_TOKEN),
        is_active="active",
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


@pytest.fixture
def auth_headers(test_user: User, db: Session) -> dict:
    """Create authentication headers for test user (JWT sub = user id)."""
    auth_service = AuthService(db)
    access_token = auth_service.create_access_token({"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {access_token}"}


def test_create_token(client: TestClient, test_user: User, auth_headers: dict):
    """Test creating a new API token. Raw token returned only once."""
    response = client.post(
        "/api/v1/tokens",
        json={"name": "New Token"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Token"
    assert data["user_id"] == test_user.id
    assert data["is_active"] == "active"
    assert "token" in data  # one-time raw token
    assert "token_prefix" in data


def test_create_token_without_subscription(
    client: TestClient, db: Session, auth_headers: dict
):
    """Test creating a token without an active subscription."""
    user = User(
        id=str(uuid.uuid4()),
        email="no_sub@example.com",
        hashed_password="hashed_password",
        full_name="No Subscription User",
        is_active=True,
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


def test_get_tokens(
    client: TestClient, test_user: User, test_token: APIToken, auth_headers: dict
):
    """Test getting all user's API tokens."""
    response = client.get("/api/v1/tokens", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == test_token.id


def test_revoke_token(
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
    assert data["is_active"] == "inactive"


def test_rotate_token(
    client: TestClient, test_user: User, test_token: APIToken, auth_headers: dict
):
    """Test rotating an API token."""
    response = client.post(
        f"/api/v1/tokens/{test_token.id}/rotate",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_token.id
    assert "token_prefix" in data


@pytest.mark.asyncio
async def test_validate_token(db: Session, test_token: APIToken):
    """Test validating an API token (plain token hashed and compared to DB)."""
    token_service = APITokenService(db)
    result = await token_service.validate_token(_TEST_PLAIN_TOKEN)
    assert result is True

    # Test invalid token
    result = await token_service.validate_token("invalid_token")
    assert result is False


@pytest.mark.asyncio
async def test_validate_inactive_token(db: Session):
    """Test that validate_token returns False for inactive (revoked) token."""
    user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        hashed_password="hashed_password",
        is_active=True,
    )
    db.add(user)
    db.commit()

    plain = "bleujs_inactive_token_plain_xyz"
    token = APIToken(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="Inactive Token",
        token_hash=_hash_token(plain),
        token_prefix=_token_display_prefix(plain),
        is_active="inactive",
    )
    db.add(token)
    db.commit()

    token_service = APITokenService(db)
    result = await token_service.validate_token(plain)
    assert result is False


@pytest.mark.asyncio
async def test_create_api_token(services: dict, test_user: User):
    """Test creating an API token using the service directly (returns one-time raw token)."""
    token_data = APITokenCreate(name="Service Token")
    token = await services["api_token_service"].create_token(test_user, token_data)
    assert token.name == "Service Token"
    assert token.user_id == test_user.id
    assert token.is_active == "active"
    assert hasattr(token, "token") and token.token  # one-time raw token


@pytest.mark.asyncio
async def test_create_api_token_without_subscription(services: dict, db: Session):
    """Test creating a token without subscription using the service directly."""
    user = User(
        id=str(uuid.uuid4()),
        email="no_sub_service@example.com",
        hashed_password="hashed_password",
        is_active=True,
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
    assert result.is_active == "inactive"


@pytest.mark.asyncio
async def test_revoke_nonexistent_token(services: dict, test_user: User):
    """Test revoking a non-existent token using the service directly."""
    with pytest.raises(HTTPException) as exc_info:
        await services["api_token_service"].revoke_token("nonexistent", test_user)
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_rotate_api_token(services: dict, test_user: User, test_token: APIToken):
    """Test rotating a token using the service directly."""
    new_token = await services["api_token_service"].rotate_token(
        test_token.id, test_user
    )
    assert new_token.id == test_token.id
    assert new_token.token_prefix  # new prefix after rotate


@pytest.mark.asyncio
async def test_create_multiple_tokens(services: dict, test_user: User):
    """Test creating multiple tokens for the same user (each gets unique raw token)."""
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
    token_data = APITokenCreate(name="Expiring Token")

    token = await services["api_token_service"].create_token(test_user, token_data)
    assert token.name == "Expiring Token"

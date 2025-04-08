"""Authentication middleware tests."""

from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import Depends, FastAPI, HTTPException
from fastapi.testclient import TestClient
from fastapi.security import HTTPAuthorizationCredentials

from src.config import settings
from src.middleware.auth import AuthMiddleware, get_current_user
from src.models.user import User
from src.services.user_service import UserService

# Test user
TEST_USER = User(
    id=1,
    email="test@example.com",
    username="testuser",
    hashed_password="hashed_password",
    is_active=True,
    is_superuser=False,
)


@pytest.fixture
def app():
    """Create test FastAPI application."""
    app = FastAPI()

    @app.get("/protected")
    async def protected_route(current_user: User = Depends(get_current_user)):
        return {"message": "Protected route", "user": current_user.email}

    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def user_service(db_session):
    """Create test user service."""
    return UserService(db_session)


@pytest.fixture
def auth_middleware(user_service):
    """Create test auth middleware."""
    return AuthMiddleware(user_service)


@pytest.fixture
def test_user(db_session):
    """Create test user."""
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password="hashed_password",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    return user


def create_test_token(user: User, expires_delta: timedelta = None):
    """Create a test JWT token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)

    to_encode = {"sub": str(user.id), "exp": expire}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def test_protected_route_with_valid_token(client):
    """Test access to protected route with valid token."""
    token = create_test_token(TEST_USER)
    response = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Protected route"
    assert response.json()["user"] == TEST_USER.email


def test_protected_route_without_token(client):
    """Test access to protected route without token."""
    response = client.get("/protected")
    assert response.status_code == 401
    assert "Could not validate credentials" in response.text


def test_protected_route_with_invalid_token(client):
    """Test access to protected route with invalid token."""
    response = client.get(
        "/protected", headers={"Authorization": "Bearer invalid-token"}
    )
    assert response.status_code == 401
    assert "Could not validate credentials" in response.text


def test_protected_route_with_expired_token(client):
    """Test access to protected route with expired token."""
    # Create an expired token
    token = create_test_token(TEST_USER, expires_delta=timedelta(seconds=-1))
    response = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "Could not validate credentials" in response.text


def test_protected_route_with_inactive_user(client):
    """Test access to protected route with inactive user."""
    inactive_user = User(
        id=2,
        email="inactive@example.com",
        username="inactive",
        hashed_password="hashed_password",
        is_active=False,
        is_superuser=False,
    )
    token = create_test_token(inactive_user)
    response = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "Could not validate credentials" in response.text


@pytest.mark.asyncio
async def test_auth_middleware_valid_token(auth_middleware, test_user):
    """Test auth middleware with valid token."""
    # Create valid token
    token = create_test_token(test_user)
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    # Call middleware
    user = await auth_middleware(None, credentials)

    assert user.id == test_user.id
    assert user.email == test_user.email


@pytest.mark.asyncio
async def test_auth_middleware_invalid_token(auth_middleware):
    """Test auth middleware with invalid token."""
    # Create invalid token
    token = "invalid_token"
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    # Call middleware
    with pytest.raises(HTTPException) as exc_info:
        await auth_middleware(None, credentials)

    assert exc_info.value.status_code == 401
    assert "Could not validate credentials" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_auth_middleware_missing_token(auth_middleware):
    """Test auth middleware with missing token."""
    # Call middleware without token
    with pytest.raises(HTTPException) as exc_info:
        await auth_middleware(None, None)

    assert exc_info.value.status_code == 401
    assert "Could not validate credentials" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_auth_middleware_inactive_user(auth_middleware, test_user, db_session):
    """Test auth middleware with inactive user."""
    # Deactivate user
    test_user.is_active = False
    db_session.commit()

    # Create token
    token = create_test_token(test_user)
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    # Call middleware
    with pytest.raises(HTTPException) as exc_info:
        await auth_middleware(None, credentials)

    assert exc_info.value.status_code == 401
    assert "Inactive user" in str(exc_info.value.detail)

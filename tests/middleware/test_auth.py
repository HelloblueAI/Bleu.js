from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from src.python.backend.middleware.auth import AuthMiddleware, get_current_user
from src.python.backend.models.user import User

# Test secret key and test user
TEST_SECRET_KEY = "test-secret-key"
TEST_USER = User(id=1, email="test@example.com", is_active=True, is_superuser=False)


@pytest.fixture
def app():
    app = FastAPI()
    app.add_middleware(AuthMiddleware, secret_key=TEST_SECRET_KEY)

    @app.get("/protected")
    async def protected_route(current_user: User = Depends(get_current_user)):
        return {"message": "Protected route", "user": current_user.email}

    return app


@pytest.fixture
def client(app):
    return TestClient(app)


def create_test_token(user: User, expires_delta: timedelta = None):
    """Create a test JWT token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)

    to_encode = {"sub": str(user.id), "email": user.email, "exp": expire}
    return jwt.encode(to_encode, TEST_SECRET_KEY, algorithm="HS256")


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
    assert "Not authenticated" in response.text


def test_protected_route_with_invalid_token(client):
    """Test access to protected route with invalid token."""
    response = client.get(
        "/protected", headers={"Authorization": "Bearer invalid-token"}
    )
    assert response.status_code == 401
    assert "Invalid token" in response.text


def test_protected_route_with_expired_token(client):
    """Test access to protected route with expired token."""
    # Create an expired token
    token = create_test_token(TEST_USER, expires_delta=timedelta(seconds=-1))
    response = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "Token has expired" in response.text


def test_protected_route_with_inactive_user(client):
    """Test access to protected route with inactive user."""
    inactive_user = User(
        id=2, email="inactive@example.com", is_active=False, is_superuser=False
    )
    token = create_test_token(inactive_user)
    response = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "Inactive user" in response.text

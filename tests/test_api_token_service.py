from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from models.subscription import APIToken, APITokenCreate
from services.api_token_service import APITokenService


@pytest.mark.asyncio
async def test_generate_token():
    """Test token generation."""
    token = APITokenService.generate_token()
    assert isinstance(token, str)
    assert len(token) > 0


@pytest.mark.asyncio
async def test_create_token(db_session, test_user, test_subscription):
    """Test creating a new API token."""
    token_data = APITokenCreate(
        name="Test Token", expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )

    token = await APITokenService.create_token(
        user_id=test_user.id, token_data=token_data, db=db_session
    )

    assert token.user_id == test_user.id
    assert token.name == "Test Token"
    assert token.is_active is True
    assert token.expires_at is not None


@pytest.mark.asyncio
async def test_create_token_without_subscription(db_session, test_user):
    """Test creating a token without an active subscription."""
    token_data = APITokenCreate(
        name="Test Token", expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )

    with pytest.raises(HTTPException) as exc_info:
        await APITokenService.create_token(
            user_id=test_user.id, token_data=token_data, db=db_session
        )

    assert exc_info.value.status_code == 403
    assert "Active subscription required" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_get_user_tokens(db_session, test_user, test_api_token):
    """Test retrieving user's API tokens."""
    tokens = await APITokenService.get_user_tokens(user_id=test_user.id, db=db_session)

    assert len(tokens) == 1
    assert tokens[0].id == test_api_token.id


@pytest.mark.asyncio
async def test_revoke_token(db_session, test_user, test_api_token):
    """Test revoking an API token."""
    result = await APITokenService.revoke_token(
        token_id=test_api_token.id, user_id=test_user.id, db=db_session
    )

    assert result is True

    # Verify token is revoked
    token = db_session.query(APIToken).filter(APIToken.id == test_api_token.id).first()
    assert token.is_active is False


@pytest.mark.asyncio
async def test_revoke_nonexistent_token(db_session, test_user):
    """Test revoking a nonexistent token."""
    with pytest.raises(HTTPException) as exc_info:
        await APITokenService.revoke_token(
            token_id="nonexistent-id", user_id=test_user.id, db=db_session
        )

    assert exc_info.value.status_code == 404
    assert "Token not found" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_validate_token(db_session, test_api_token):
    """Test validating an API token."""
    token = await APITokenService.validate_token(
        token=test_api_token.token, db=db_session
    )

    assert token is not None
    assert token.id == test_api_token.id
    assert token.last_used is not None


@pytest.mark.asyncio
async def test_validate_expired_token(db_session, test_user):
    """Test validating an expired token."""
    expired_token = APIToken(
        id="expired-token-id",
        user_id=test_user.id,
        name="Expired Token",
        token="expired-token-value",
        is_active=True,
        created_at=datetime.now(timezone.utc) - timedelta(days=31),
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    db_session.add(expired_token)
    db_session.commit()

    token = await APITokenService.validate_token(
        token="expired-token-value", db=db_session
    )

    assert token is None

    # Verify token is deactivated
    expired_token = (
        db_session.query(APIToken).filter(APIToken.id == "expired-token-id").first()
    )
    assert expired_token.is_active is False


@pytest.mark.asyncio
async def test_validate_inactive_token(db_session, test_api_token):
    """Test validating an inactive token."""
    test_api_token.is_active = False
    db_session.commit()

    token = await APITokenService.validate_token(
        token=test_api_token.token, db=db_session
    )

    assert token is None


@pytest.mark.asyncio
async def test_rotate_token(db_session, test_user, test_api_token):
    """Test rotating (regenerating) an API token."""
    old_token = test_api_token.token

    new_token = await APITokenService.rotate_token(
        token_id=test_api_token.id, user_id=test_user.id, db=db_session
    )

    assert new_token.token != old_token
    assert new_token.last_used is not None

    # Verify old token is invalid
    token = await APITokenService.validate_token(token=old_token, db=db_session)
    assert token is None

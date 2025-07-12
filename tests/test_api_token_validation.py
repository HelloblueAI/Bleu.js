from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.orm import Session

from models.rate_limit import RateLimit
from models.subscription import APIToken, APITokenCreate
from services.api_token_service import APITokenService
from services.token_manager import TokenManager


@pytest.fixture
def test_token(db: Session, test_user):
    token = APIToken(
        id="test_token_id",
        user_id=test_user.id,
        name="Test Token",
        token="test_token_value",
        is_active=True,
    )
    db.add(token)
    db.commit()
    return token


@pytest.mark.asyncio
async def test_validate_token_success(db_session, test_api_token):
    """Test successful token validation."""
    token = await APITokenService.validate_token(
        token=test_api_token.token, db=db_session
    )

    assert token is not None
    assert token.id == test_api_token.id
    assert token.is_active is True
    assert token.last_used is not None


@pytest.mark.asyncio
async def test_validate_token_not_found(db_session):
    """Test validation of non-existent token."""
    token = await APITokenService.validate_token(
        token="nonexistent-token", db=db_session
    )

    assert token is None


@pytest.mark.asyncio
async def test_validate_token_expired(db_session, test_user):
    """Test validation of expired token."""
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
async def test_validate_token_inactive(db_session, test_api_token):
    """Test validation of inactive token."""
    test_api_token.is_active = False
    db_session.commit()

    token = await APITokenService.validate_token(
        token=test_api_token.token, db=db_session
    )

    assert token is None


@pytest.mark.asyncio
async def test_validate_token_rate_limit(db_session, test_api_token):
    """Test token validation with rate limiting."""
    # Set up rate limiting
    test_api_token.rate_limit = 100
    test_api_token.rate_limit_period = 60  # 1 minute
    db_session.commit()

    # Make multiple requests
    for _ in range(100):
        token = await APITokenService.validate_token(
            token=test_api_token.token, db=db_session
        )
        assert token is not None

    # Exceed rate limit
    token = await APITokenService.validate_token(
        token=test_api_token.token, db=db_session
    )
    assert token is None


@pytest.mark.asyncio
async def test_validate_token_with_subscription(
    db_session, test_user, test_subscription
):
    """Test token validation with subscription."""
    token_data = APITokenCreate(
        name="Test Token", expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )

    token = await APITokenService.create_token(
        user_id=test_user.id, token_data=token_data, db=db_session
    )

    validated_token = await APITokenService.validate_token(
        token=token.token, db=db_session
    )

    assert validated_token is not None
    assert validated_token.id == token.id
    assert validated_token.is_active is True
    assert validated_token.last_used is not None


def test_validate_token_without_subscription(db: Session, test_user):
    token = APIToken(
        id="no_sub_token_id",
        user_id=test_user.id,
        name="No Sub Token",
        token="no_sub_token_value",
        is_active=True,
    )
    db.add(token)
    db.commit()

    validated_token = APITokenService.validate_token(token.token, db)
    assert validated_token is None


def test_validate_token_rate_limit_exceeded(
    db: Session, test_user, test_subscription, test_token
):
    # Set rate limit to maximum
    rate_limit = db.query(RateLimit).filter(RateLimit.user_id == test_user.id).first()
    if rate_limit is None:
        raise ValueError("Rate limit not found")
    rate_limit.calls_count = test_subscription.plan.api_calls_limit
    db.commit()

    # Try to validate token
    validated_token = APITokenService.validate_token(test_token.token, db)
    assert validated_token is None


def test_validate_token_after_rate_limit_reset(
    db: Session, test_user, test_subscription, test_token
):
    # Set rate limit to maximum
    rate_limit = db.query(RateLimit).filter(RateLimit.user_id == test_user.id).first()
    if rate_limit is None:
        raise ValueError("Rate limit not found")
    rate_limit.calls_count = test_subscription.plan.api_calls_limit
    rate_limit.last_reset = datetime.now(timezone.utc) - timedelta(minutes=2)
    db.commit()

    # Try to validate token (should work after reset)
    validated_token = APITokenService.validate_token(test_token.token, db)
    assert validated_token is not None
    assert validated_token.id == test_token.id


def test_token_usage_tracking():
    token = TokenManager.get_token("test_token")
    if token is not None:
        assert token.calls_count == 0
        assert token.last_reset is not None


def test_token_reset():
    token = TokenManager.get_token("test_token")
    if token is not None:
        token.calls_count = 100
        TokenManager.reset_token("test_token")
        assert token.calls_count == 0
        assert token.last_reset is not None

import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.orm import Session

from config.test.config import TEST_USER_EMAIL, TEST_USER_PASSWORD
from src.models.rate_limit import RateLimit
from src.models.subscription import Subscription, SubscriptionPlan
from src.models.user import User
from src.services.rate_limiting_service import RateLimiter, RateLimitingService

# Load test configuration from environment variables
TEST_PASSWORD = os.getenv("TEST_USER_PASSWORD", "test_password_123")
TEST_EMAIL = os.getenv("TEST_USER_EMAIL", "test@example.com")


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user with an active subscription."""
    user = User(
        id=str(uuid.uuid4()),
        email=TEST_USER_EMAIL,
        hashed_password=TEST_USER_PASSWORD,
        is_active=True,
        is_verified=True,
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
def rate_limit_service(db: Session):
    return RateLimitingService(db)


@pytest.mark.asyncio
async def test_check_rate_limit(db: Session, test_user, rate_limit_service):
    # Create rate limit record
    current_time = datetime.now(timezone.utc)
    rate_limit = RateLimit(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        endpoint="test_endpoint",
        limit=test_user.subscription.plan.api_calls_limit,
        period=60,  # 1 minute period
        calls_count=test_user.subscription.plan.api_calls_limit
        - 1,  # One less than limit
        last_reset=current_time,
        current_period_start=current_time,
        last_used=current_time,
    )
    db.add(rate_limit)
    db.commit()

    # Test rate limit not exceeded (should succeed as we're at limit-1)
    result = await rate_limit_service.check_rate_limit_user(
        test_user.id, db, "test_endpoint"
    )
    assert result is True

    # This call should increment the counter to the limit
    result = await rate_limit_service.check_rate_limit_user(
        test_user.id, db, "test_endpoint"
    )
    assert result is False  # Should be False when limit is reached


@pytest.mark.asyncio
async def test_rate_limit_reset(db: Session, test_user, rate_limit_service):
    # Create rate limit record with old reset time
    old_time = datetime.now(timezone.utc) - timedelta(hours=2)
    rate_limit = RateLimit(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        endpoint="test_endpoint",
        limit=test_user.subscription.plan.api_calls_limit,
        period=3600,
        calls_count=test_user.subscription.plan.api_calls_limit,  # Max out the calls
        last_reset=old_time,
        current_period_start=old_time,
        last_used=old_time,
    )
    db.add(rate_limit)
    db.commit()

    # Test that rate limit resets
    result = await rate_limit_service.check_rate_limit_user(
        test_user.id, db, "test_endpoint"
    )
    assert result is True

    # Verify the reset
    updated_rate_limit = (
        db.query(RateLimit)
        .filter(
            RateLimit.user_id == test_user.id, RateLimit.endpoint == "test_endpoint"
        )
        .first()
    )
    assert updated_rate_limit is not None, "Rate limit record not found"
    assert updated_rate_limit.calls_count == 1  # Should be 1 after reset and use
    assert updated_rate_limit.last_reset.replace(tzinfo=timezone.utc) > old_time


@pytest.mark.asyncio
async def test_different_endpoints(db: Session, test_user, rate_limit_service):
    # Test rate limits for different endpoints
    result1 = await rate_limit_service.check_rate_limit_user(
        test_user.id, db, "endpoint1"
    )
    assert result1 is True

    result2 = await rate_limit_service.check_rate_limit_user(
        test_user.id, db, "endpoint2"
    )
    assert result2 is True

    # Verify separate rate limit records
    rate_limits = db.query(RateLimit).filter(RateLimit.user_id == test_user.id).all()
    assert len(rate_limits) == 2


def test_rate_limit_tracking():
    rate_limit = RateLimiter.get_rate_limit("test_client")
    # Create a new rate limit if none exists
    if rate_limit is None:
        rate_limit = RateLimiter.create_rate_limit("test_client")
    # Now we can safely access members
    assert rate_limit.calls_count == 0
    assert rate_limit.last_reset is not None

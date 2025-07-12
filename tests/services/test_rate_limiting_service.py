import pytest
from fastapi import HTTPException

from src.services.rate_limiting_service import RateLimitingService


@pytest.fixture
async def rate_limiter():
    service = RateLimitingService()
    await service.initialize()
    yield service
    # Cleanup if needed


@pytest.mark.asyncio
async def test_rate_limit_check(rate_limiter):
    """Test basic rate limit check."""
    user_id = "test_user"
    plan = "free"

    # First request should pass
    assert await rate_limiter.check_rate_limit(user_id, plan) is True

    # Make requests up to the limit
    for _ in range(99):  # 99 more requests (total 100)
        assert await rate_limiter.check_rate_limit(user_id, plan) is True

    # Next request should fail
    with pytest.raises(HTTPException) as exc_info:
        await rate_limiter.check_rate_limit(user_id, plan)
    assert exc_info.value.status_code == 429


@pytest.mark.asyncio
async def test_rate_limit_reset(rate_limiter):
    """Test rate limit reset."""
    user_id = "test_user"
    plan = "free"

    # Exhaust rate limit
    for _ in range(100):
        await rate_limiter.check_rate_limit(user_id, plan)

    # Reset rate limit
    await rate_limiter.reset_rate_limit(user_id)

    # Should be able to make requests again
    assert await rate_limiter.check_rate_limit(user_id, plan) is True


@pytest.mark.asyncio
async def test_rate_limit_status(rate_limiter):
    """Test rate limit status retrieval."""
    user_id = "test_user"
    plan = "free"

    # Get initial status
    status = await rate_limiter.get_rate_limit_status(user_id)
    assert status["remaining"] == 100

    # Make some requests
    for _ in range(50):
        await rate_limiter.check_rate_limit(user_id, plan)

    # Check updated status
    status = await rate_limiter.get_rate_limit_status(user_id)
    assert status["remaining"] == 50


@pytest.mark.asyncio
async def test_different_plans(rate_limiter):
    """Test rate limits for different subscription plans."""
    user_id = "test_user"

    # Test free plan (100 requests)
    for _ in range(100):
        assert await rate_limiter.check_rate_limit(user_id, "free") is True
    with pytest.raises(HTTPException):
        await rate_limiter.check_rate_limit(user_id, "free")

    # Reset and test basic plan (1000 requests)
    await rate_limiter.reset_rate_limit(user_id)
    for _ in range(1000):
        assert await rate_limiter.check_rate_limit(user_id, "basic") is True
    with pytest.raises(HTTPException):
        await rate_limiter.check_rate_limit(user_id, "basic")


@pytest.mark.asyncio
async def test_token_refill(rate_limiter):
    """Test token refill mechanism."""
    user_id = "test_user"
    plan = "free"

    # Exhaust rate limit
    for _ in range(100):
        await rate_limiter.check_rate_limit(user_id, plan)

    # Wait for refill (1 second should refill 1.67 tokens)
    import asyncio

    await asyncio.sleep(1)

    # Should be able to make at least one more request
    assert await rate_limiter.check_rate_limit(user_id, plan) is True


@pytest.mark.asyncio
async def test_invalid_plan(rate_limiter):
    """Test behavior with invalid plan."""
    user_id = "test_user"

    with pytest.raises(ValueError):
        await rate_limiter.update_rate_limits("invalid_plan", 100, 60)

    # Should default to free plan
    assert await rate_limiter.check_rate_limit(user_id, "invalid_plan") is True

from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from src.services.rate_limiting_service import RateLimiter, RateLimitingService


@pytest.fixture
def redis_mock():
    return AsyncMock()


@pytest.fixture
def rate_limit_service(redis_mock):
    svc = RateLimitingService(redis=redis_mock)
    svc.window = 60
    svc.max_requests = 2
    return svc


@pytest.mark.asyncio
async def test_check_rate_limit_first_request(redis_mock, rate_limit_service):
    redis_mock.get.return_value = None
    result = await rate_limit_service.check_rate_limit("client:1")
    assert result is False
    redis_mock.setex.assert_awaited_once_with("client:1", 60, 1)


@pytest.mark.asyncio
async def test_rate_limit_exceeded_raises(redis_mock, rate_limit_service):
    redis_mock.get.return_value = "2"
    redis_mock.ttl.return_value = 30
    with pytest.raises(HTTPException) as exc_info:
        await rate_limit_service.check_rate_limit("client:1")
    assert exc_info.value.status_code == 429
    assert exc_info.value.headers["Retry-After"] == "30"


@pytest.mark.asyncio
async def test_get_rate_limit_status(redis_mock, rate_limit_service):
    redis_mock.get.return_value = "1"
    redis_mock.ttl.return_value = 15
    status = await rate_limit_service.get_rate_limit_status("client:1")
    assert status["remaining"] == 1
    assert "reset" in status


def test_rate_limiter_alias_exists():
    assert RateLimiter is RateLimitingService

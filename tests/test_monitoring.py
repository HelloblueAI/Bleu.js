from datetime import datetime, timedelta, timezone

import pytest

from models.subscription import PlanType
from services.monitoring_service import MonitoringService


@pytest.mark.asyncio
async def test_setup_monitoring(db_session, test_customer):
    """Test setting up monitoring for a customer."""
    await MonitoringService.setup_monitoring(
        customer_id=test_customer.id, db=db_session
    )

    # Verify monitoring was set up
    monitoring = await MonitoringService.get_monitoring(
        customer_id=test_customer.id, db=db_session
    )
    assert monitoring is not None
    assert monitoring.customer_id == test_customer.id
    assert monitoring.is_active is True


@pytest.mark.asyncio
async def test_record_metrics(db_session, test_customer):
    """Test recording monitoring metrics."""
    # Set up monitoring
    await MonitoringService.setup_monitoring(
        customer_id=test_customer.id, db=db_session
    )

    # Record some metrics
    await MonitoringService.record_metrics(
        customer_id=test_customer.id,
        metrics={
            "response_time": 0.5,
            "error_rate": 0.01,
            "request_count": 100,
        },
        db=db_session,
    )

    # Verify metrics were recorded
    metrics = await MonitoringService.get_metrics(
        customer_id=test_customer.id, db=db_session
    )
    assert abs(metrics["response_time"] - 0.5) < 0.001
    assert abs(metrics["error_rate"] - 0.01) < 0.001
    assert metrics["request_count"] == 100


@pytest.mark.asyncio
async def test_check_sla_violations(db_session, test_customer):
    """Test checking SLA violations."""
    # Set up monitoring with SLAs
    await MonitoringService.setup_monitoring(
        customer_id=test_customer.id,
        sla_config={
            "response_time_threshold": 1.0,
            "error_rate_threshold": 0.05,
            "uptime_threshold": 0.99,
        },
        db=db_session,
    )

    # Record metrics that violate SLAs
    await MonitoringService.record_metrics(
        customer_id=test_customer.id,
        metrics={
            "response_time": 2.0,  # Violates 1.0s threshold
            "error_rate": 0.1,  # Violates 0.05 threshold
            "uptime": 0.98,  # Violates 0.99 threshold
        },
        db=db_session,
    )

    # Check for violations
    violations = await MonitoringService.check_sla_violations(
        customer_id=test_customer.id, db=db_session
    )

    assert len(violations) == 3
    assert any(v["metric"] == "response_time" for v in violations)
    assert any(v["metric"] == "error_rate" for v in violations)
    assert any(v["metric"] == "uptime" for v in violations)


@pytest.mark.asyncio
async def test_send_alert(db_session, test_customer):
    """Test sending monitoring alerts."""
    # Set up monitoring
    await MonitoringService.setup_monitoring(
        customer_id=test_customer.id, db=db_session
    )

    # Send an alert
    alert = await MonitoringService.send_alert(
        customer_id=test_customer.id,
        alert_type="error_rate",
        message="Error rate exceeded threshold",
        severity="high",
        db=db_session,
    )

    assert alert is not None
    assert alert.customer_id == test_customer.id
    assert alert.alert_type == "error_rate"
    assert alert.severity == "high"


@pytest.mark.asyncio
async def test_cleanup_old_metrics(db_session, test_customer):
    """Test cleaning up old monitoring metrics."""
    # Set up monitoring
    await MonitoringService.setup_monitoring(
        customer_id=test_customer.id, db=db_session
    )

    # Record some old metrics
    old_time = datetime.now(timezone.utc) - timedelta(days=31)
    await MonitoringService.record_metrics(
        customer_id=test_customer.id,
        metrics={"response_time": 0.5},
        timestamp=old_time,
        db=db_session,
    )

    # Clean up old metrics
    await MonitoringService.cleanup_old_metrics(
        customer_id=test_customer.id,
        days_threshold=30,
        db=db_session,
    )

    # Verify old metrics were cleaned up
    metrics = await MonitoringService.get_metrics(
        customer_id=test_customer.id,
        start_time=old_time,
        end_time=old_time + timedelta(days=1),
        db=db_session,
    )
    assert not metrics


@pytest.fixture
def monitoring_service():
    return MonitoringService()


def test_track_api_call(monitoring_service):
    """Test tracking API calls."""
    user_id = "test_user"
    plan_type = PlanType.COR_E
    remaining_calls = 100
    service_type = "test_service"

    # Track a call
    monitoring_service.track_api_call(user_id, plan_type, remaining_calls, service_type)

    # Get usage stats
    stats = monitoring_service.get_usage_stats(user_id)
    assert stats["total_calls"] == 1
    assert stats["service_calls"]["test_service"] == 1
    assert (
        abs(stats["average_response_time"] - 0.0) < 0.001
    )  # Use approximate comparison


def test_check_rate_limit(monitoring_service):
    """Test rate limiting."""
    user_id = "test_user"
    plan_type = PlanType.COR_E

    # Make multiple calls quickly
    for _ in range(10):
        monitoring_service.track_api_call(user_id, plan_type, 100, "test_service")

    # Check rate limit
    assert monitoring_service.check_rate_limit(user_id, plan_type) is True

    # Make more calls to exceed rate limit
    for _ in range(20):
        monitoring_service.track_api_call(user_id, plan_type, 100, "test_service")

    # Check rate limit again
    assert monitoring_service.check_rate_limit(user_id, plan_type) is False


def test_get_usage_stats(monitoring_service):
    """Test getting usage statistics."""
    user_id = "test_user"
    plan_type = PlanType.COR_E
    remaining_calls = 100
    service_type = "test_service"

    # Track multiple calls
    for _ in range(5):
        monitoring_service.track_api_call(
            user_id, plan_type, remaining_calls, service_type
        )

    # Get stats
    stats = monitoring_service.get_usage_stats(user_id)
    assert stats["total_calls"] == 5
    assert stats["service_calls"]["test_service"] == 5
    assert (
        abs(stats["average_response_time"] - 0.0) < 0.001
    )  # Use approximate comparison


def test_reset_usage_stats(monitoring_service):
    """Test resetting usage statistics."""
    user_id = "test_user"
    plan_type = PlanType.COR_E
    remaining_calls = 100
    service_type = "test_service"

    # Track some calls
    for _ in range(3):
        monitoring_service.track_api_call(
            user_id, plan_type, remaining_calls, service_type
        )

    # Reset stats
    monitoring_service.reset_usage_stats(user_id)

    # Check stats are reset
    stats = monitoring_service.get_usage_stats(user_id)
    assert stats["total_calls"] == 0
    assert stats["service_calls"] == {}
    assert (
        abs(stats["average_response_time"] - 0.0) < 0.001
    )  # Use approximate comparison

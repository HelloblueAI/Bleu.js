import pytest

from services.monitoring_service import MonitoringService


@pytest.mark.asyncio
async def test_record_and_get_metrics():
    service = MonitoringService()

    await service.record_metric("response_time", 0.5, {"route": "/health"})
    metrics = await service.get_metrics()

    assert "response_time" in metrics
    assert metrics["response_time"]["value"] == 0.5
    assert metrics["response_time"]["tags"]["route"] == "/health"


@pytest.mark.asyncio
async def test_get_metrics_filtering():
    service = MonitoringService()

    await service.record_metric("response_time", 0.3)
    await service.record_metric("error_rate", 0.01)
    filtered = await service.get_metrics(["error_rate"])

    assert set(filtered.keys()) == {"error_rate"}
    assert filtered["error_rate"]["value"] == 0.01


@pytest.mark.asyncio
async def test_create_and_filter_alerts():
    service = MonitoringService()

    await service.create_alert("latency", "Latency increased", severity="warning")
    await service.create_alert("errors", "Error spike detected", severity="critical")

    all_alerts = await service.get_alerts()
    critical = await service.get_alerts("critical")

    assert len(all_alerts) == 2
    assert len(critical) == 1
    assert critical[0]["type"] == "errors"


@pytest.mark.asyncio
async def test_health_check_counts():
    service = MonitoringService()

    await service.record_metric("requests_total", 42)
    await service.create_alert("capacity", "Approaching limit", severity="info")
    health = await service.health_check()

    assert health["status"] == "healthy"
    assert health["metrics_count"] == 1
    assert health["alerts_count"] == 1

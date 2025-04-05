"""
Advanced monitoring and analytics system for the backend.
"""

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List

import prometheus_client as prom
import psutil
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider

logger = logging.getLogger(__name__)


@dataclass
class SystemMetrics:
    """System performance metrics."""

    cpu_percent: float
    memory_percent: float
    disk_usage_percent: float
    network_io: Dict[str, float]
    timestamp: datetime


@dataclass
class ApplicationMetrics:
    """Application-specific metrics."""

    request_count: int
    error_count: int
    average_response_time: float
    active_users: int
    timestamp: datetime


class MonitoringSystem:
    """Advanced monitoring and analytics system."""

    def __init__(self, config: Dict[str, Any]):
        """Initialize monitoring system."""
        self.config = config
        self._setup_metrics()
        self._setup_tracing()
        self._setup_analytics()

    def _setup_metrics(self):
        """Setup Prometheus metrics."""
        # System metrics
        self.cpu_gauge = prom.Gauge("system_cpu_percent", "CPU usage percentage")
        self.memory_gauge = prom.Gauge(
            "system_memory_percent", "Memory usage percentage"
        )
        self.disk_gauge = prom.Gauge("system_disk_percent", "Disk usage percentage")

        # Application metrics
        self.request_counter = prom.Counter("app_requests_total", "Total requests")
        self.error_counter = prom.Counter("app_errors_total", "Total errors")
        self.response_time = prom.Histogram(
            "app_response_time_seconds", "Response time"
        )
        self.active_users = prom.Gauge("app_active_users", "Active users")

    def _setup_tracing(self):
        """Setup OpenTelemetry tracing."""
        tracer_provider = TracerProvider()
        jaeger_exporter = JaegerExporter(
            agent_host_name=self.config["jaeger"]["host"],
            agent_port=self.config["jaeger"]["port"],
        )
        tracer_provider.add_span_processor(jaeger_exporter)
        trace.set_tracer_provider(tracer_provider)

    def _setup_analytics(self):
        """Setup analytics system."""
        self.metrics_history: List[ApplicationMetrics] = []
        self.system_history: List[SystemMetrics] = []

    async def collect_system_metrics(self) -> SystemMetrics:
        """Collect system performance metrics."""
        metrics = SystemMetrics(
            cpu_percent=psutil.cpu_percent(),
            memory_percent=psutil.virtual_memory().percent,
            disk_usage_percent=psutil.disk_usage("/").percent,
            network_io={
                "bytes_sent": psutil.net_io_counters().bytes_sent,
                "bytes_recv": psutil.net_io_counters().bytes_recv,
            },
            timestamp=datetime.utcnow(),
        )

        # Update Prometheus metrics
        self.cpu_gauge.set(metrics.cpu_percent)
        self.memory_gauge.set(metrics.memory_percent)
        self.disk_gauge.set(metrics.disk_usage_percent)

        self.system_history.append(metrics)
        return metrics

    async def collect_application_metrics(self) -> ApplicationMetrics:
        """Collect application-specific metrics."""
        metrics = ApplicationMetrics(
            request_count=self.request_counter._value.get(),
            error_count=self.error_counter._value.get(),
            average_response_time=self.response_time._sum.get()
            / max(1, self.response_time._count.get()),
            active_users=self.active_users._value.get(),
            timestamp=datetime.utcnow(),
        )

        self.metrics_history.append(metrics)
        return metrics

    def record_request(self, duration: float, status_code: int):
        """Record request metrics."""
        self.request_counter.inc()
        self.response_time.observe(duration)
        if status_code >= 400:
            self.error_counter.inc()

    def update_active_users(self, count: int):
        """Update active users count."""
        self.active_users.set(count)

    async def get_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report."""
        system_metrics = await self.collect_system_metrics()
        app_metrics = await self.collect_application_metrics()

        return {
            "system": {
                "cpu_percent": system_metrics.cpu_percent,
                "memory_percent": system_metrics.memory_percent,
                "disk_usage_percent": system_metrics.disk_usage_percent,
                "network_io": system_metrics.network_io,
            },
            "application": {
                "request_count": app_metrics.request_count,
                "error_rate": app_metrics.error_count
                / max(1, app_metrics.request_count),
                "average_response_time": app_metrics.average_response_time,
                "active_users": app_metrics.active_users,
            },
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def get_health_status(self) -> Dict[str, Any]:
        """Get system health status."""
        metrics = await self.collect_system_metrics()

        return {
            "status": "healthy",
            "cpu_usage": metrics.cpu_percent,
            "memory_usage": metrics.memory_percent,
            "disk_usage": metrics.disk_usage_percent,
            "timestamp": metrics.timestamp.isoformat(),
        }

    def cleanup(self):
        """Cleanup monitoring resources."""
        prom.unregister(self.cpu_gauge)
        prom.unregister(self.memory_gauge)
        prom.unregister(self.disk_gauge)
        prom.unregister(self.request_counter)
        prom.unregister(self.error_counter)
        prom.unregister(self.response_time)
        prom.unregister(self.active_users)


# Create global monitoring instance
monitoring_system = MonitoringSystem({"jaeger": {"host": "localhost", "port": 6831}})

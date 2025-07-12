import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional

import aiohttp
import boto3
from fastapi import HTTPException, status
from prometheus_client import REGISTRY, Counter, Gauge, Histogram

from src.config import settings

logger = logging.getLogger(__name__)


class MonitoringService:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MonitoringService, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not MonitoringService._initialized:
            # Clean up existing metrics
            collectors_to_remove = []
            for collector in REGISTRY._collector_to_names.keys():
                try:
                    if hasattr(collector, "name") and collector.name.startswith(
                        "bleujs_"
                    ):
                        collectors_to_remove.append(collector)
                except (AttributeError, TypeError):
                    continue

            for collector in collectors_to_remove:
                try:
                    REGISTRY.unregister(collector)
                except (ValueError, KeyError):
                    pass

            # Prometheus metrics
            self.uptime_gauge = Gauge("bleujs_uptime", "Service uptime percentage")
            self.response_time_histogram = Histogram(
                "bleujs_response_time", "API response time in seconds"
            )
            self.api_calls_counter = Counter(
                "bleujs_api_calls_total", "Total number of API calls"
            )
            self.error_rate_gauge = Gauge(
                "bleujs_error_rate", "API error rate percentage"
            )
            self.rate_limit_counter = Counter(
                "bleujs_rate_limit_hits", "Number of rate limit hits"
            )

            # Monitoring thresholds
            self.uptime_thresholds = {"cor-e": 99.9, "enterprise": 99.99}
            self.response_time_thresholds = {
                "cor-e": 1.0,  # seconds
                "enterprise": 0.5,  # seconds
            }

            # Rate limits per plan
            self.rate_limits = {
                "cor-e": 10,  # requests per second
                "enterprise": 50,  # requests per second
            }

            # Initialize monitoring data
            self.monitoring_data = {}
            self.rate_limit_data = {}

            MonitoringService._initialized = True

    async def setup_uptime_monitoring(
        self, customer_id: str, uptime_sla: float
    ) -> None:
        """Set up uptime monitoring for a customer."""
        try:
            self.monitoring_data[customer_id] = {
                "uptime": {
                    "start_time": datetime.now(timezone.utc),
                    "downtime": timedelta(0),
                    "total_time": timedelta(0),
                    "sla": uptime_sla,
                }
            }

            # Start uptime monitoring task
            self._uptime_task = asyncio.create_task(self._monitor_uptime(customer_id))

            logger.info(f"Uptime monitoring set up for customer {customer_id}")

        except Exception as e:
            logger.error(f"Error setting up uptime monitoring: {str(e)}")
            raise

    async def setup_performance_monitoring(
        self, customer_id: str, response_time: str
    ) -> None:
        """Set up performance monitoring for a customer."""
        try:
            if customer_id not in self.monitoring_data:
                self.monitoring_data[customer_id] = {}

            self.monitoring_data[customer_id]["performance"] = {
                "response_time_threshold": self.response_time_thresholds[response_time],
                "response_times": [],
                "errors": 0,
                "total_requests": 0,
            }

            logger.info(f"Performance monitoring set up for customer {customer_id}")

        except Exception as e:
            logger.error(f"Error setting up performance monitoring: {str(e)}")
            raise

    async def setup_usage_monitoring(
        self, customer_id: str, api_calls_limit: int
    ) -> None:
        """Set up usage monitoring for a customer."""
        try:
            if customer_id not in self.monitoring_data:
                self.monitoring_data[customer_id] = {}

            self.monitoring_data[customer_id]["usage"] = {
                "limit": api_calls_limit,
                "current": 0,
                "reset_date": datetime.now(timezone.utc) + timedelta(days=30),
            }

            logger.info(f"Usage monitoring set up for customer {customer_id}")

        except Exception as e:
            logger.error(f"Error setting up usage monitoring: {str(e)}")
            raise

    async def _monitor_uptime(self, customer_id: str) -> None:
        """Monitor service uptime for a customer."""
        while True:
            try:
                # Check service health
                is_healthy = await self._check_service_health()

                # Update uptime metrics
                if customer_id in self.monitoring_data:
                    monitoring = self.monitoring_data[customer_id]["uptime"]
                    monitoring["total_time"] = (
                        datetime.now(timezone.utc) - monitoring["start_time"]
                    )

                    if not is_healthy:
                        monitoring["downtime"] += timedelta(minutes=1)

                    uptime_percentage = 100 * (
                        1 - monitoring["downtime"] / monitoring["total_time"]
                    )
                    self.uptime_gauge.labels(customer=customer_id).set(
                        uptime_percentage
                    )

                    # Check if SLA is violated
                    if uptime_percentage < monitoring["sla"]:
                        await self._handle_sla_violation(
                            customer_id, "uptime", uptime_percentage
                        )

                await asyncio.sleep(60)  # Check every minute

            except Exception as e:
                logger.error(f"Error monitoring uptime: {str(e)}")
                await asyncio.sleep(60)

    async def _check_service_health(self) -> bool:
        """Check if the service is healthy."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{settings.API_BASE_URL}/health") as response:
                    return response.status == 200
        except Exception as e:
            logger.error(f"Error checking service health: {str(e)}")
            return False

    async def record_api_call(
        self, customer_id: str, response_time: float, success: bool
    ) -> None:
        """Record an API call for monitoring."""
        try:
            if customer_id in self.monitoring_data:
                # Update response time metrics
                self.response_time_histogram.labels(customer=customer_id).observe(
                    response_time
                )

                # Update performance monitoring
                perf_data = self.monitoring_data[customer_id]["performance"]
                perf_data["response_times"].append(response_time)
                perf_data["total_requests"] += 1

                if not success:
                    perf_data["errors"] += 1

                # Calculate error rate
                error_rate = (perf_data["errors"] / perf_data["total_requests"]) * 100
                self.error_rate_gauge.labels(customer=customer_id).set(error_rate)

                # Update usage monitoring
                usage_data = self.monitoring_data[customer_id]["usage"]
                usage_data["current"] += 1

                # Check if usage limit is approaching
                usage_percentage = (usage_data["current"] / usage_data["limit"]) * 100
                if usage_percentage >= 80:  # Alert at 80% usage
                    await self._handle_usage_alert(customer_id, usage_percentage)

                # Reset usage counter if needed
                if datetime.now(timezone.utc) >= usage_data["reset_date"]:
                    usage_data["current"] = 0
                    usage_data["reset_date"] = datetime.now(timezone.utc) + timedelta(
                        days=30
                    )

        except Exception as e:
            logger.error(f"Error recording API call: {str(e)}")

    async def _handle_sla_violation(
        self, customer_id: str, metric: str, value: float
    ) -> None:
        """Handle SLA violation by sending alerts."""
        try:
            # Get customer email from database
            customer_email = await self._get_customer_email(customer_id)
            if not customer_email:
                return

            # Send alert email
            await self._send_alert_email(
                email=customer_email,
                subject=f"Bleu.js SLA Violation Alert - {metric}",
                message=f"Your {metric} SLA has been violated. "
                f"Current value: {value:.2f}%",
            )

            logger.warning(
                f"SLA violation for customer {customer_id}: {metric} = {value:.2f}%"
            )

        except Exception as e:
            logger.error(f"Error handling SLA violation: {str(e)}")

    async def _handle_usage_alert(
        self, customer_id: str, usage_percentage: float
    ) -> None:
        """Handle usage alert by sending notifications."""
        try:
            # Get customer email from database
            customer_email = await self._get_customer_email(customer_id)
            if not customer_email:
                return

            # Send alert email
            await self._send_alert_email(
                email=customer_email,
                subject="Bleu.js API Usage Alert",
                message=f"Your API usage has reached {usage_percentage:.1f}% "
                f"of your monthly limit.",
            )

            logger.info(
                f"Usage alert sent to customer {customer_id}: {usage_percentage:.1f}%"
            )

        except Exception as e:
            logger.error(f"Error handling usage alert: {str(e)}")

    async def _get_customer_email(self, customer_id: str) -> Optional[str]:
        """Get customer email from database."""
        # Implement database lookup

    async def _send_alert_email(self, email: str, subject: str, message: str) -> None:
        """Send alert email to customer."""
        # Implement email sending

    def get_monitoring_data(self, customer_id: str) -> Optional[Dict]:
        """Get monitoring data for a customer."""
        return self.monitoring_data.get(customer_id)

    async def record_metric(self, name: str, unit: str = "Count") -> None:
        """Record a metric in CloudWatch."""
        try:
            cloudwatch = boto3.client("cloudwatch")
            cloudwatch.put_metric_data(
                Namespace="BleuJS",
                MetricData=[
                    {
                        "MetricName": name,
                        "Value": 1,
                        "Unit": unit,
                        "Dimensions": [
                            {"Name": "Environment", "Value": self.environment}
                        ],
                    }
                ],
            )
        except Exception as e:
            logger.error(f"Error recording metric: {str(e)}")

    async def record_alarm(self, name: str) -> None:
        """Record an alarm in CloudWatch."""
        try:
            cloudwatch = boto3.client("cloudwatch")
            cloudwatch.put_metric_alarm(
                AlarmName=f"{name}-{self.environment}",
                MetricName=name,
                Namespace="BleuJS",
                Statistic="Sum",
                Period=300,
                EvaluationPeriods=1,
                Threshold=1,
                ComparisonOperator="GreaterThanThreshold",
                AlarmDescription=f"Alarm for {name}",
                Dimensions=[{"Name": "Environment", "Value": self.environment}],
            )
        except Exception as e:
            logger.error(f"Error recording alarm: {str(e)}")

    async def cleanup_old_metrics(self) -> None:
        """Clean up old metrics from CloudWatch."""
        try:
            cloudwatch = boto3.client("cloudwatch")
            response = cloudwatch.list_metrics(
                Namespace="BleuJS",
                Dimensions=[{"Name": "Environment", "Value": self.environment}],
            )

            for metric in response["Metrics"]:
                cloudwatch.delete_metric(
                    Namespace="BleuJS",
                    MetricName=metric["MetricName"],
                    Dimensions=metric["Dimensions"],
                )
        except Exception as e:
            logger.error(f"Error cleaning up metrics: {str(e)}")

    async def check_rate_limit(self, customer_id: str, plan_type: str) -> bool:
        """Check if the customer has exceeded their rate limit."""
        current_time = datetime.now(timezone.utc)

        # Initialize rate limit data if not exists
        if customer_id not in self.rate_limit_data:
            self.rate_limit_data[customer_id] = {"requests": [], "plan_type": plan_type}

        # Clean up old requests
        self.rate_limit_data[customer_id]["requests"] = [
            req_time
            for req_time in self.rate_limit_data[customer_id]["requests"]
            if (current_time - req_time).total_seconds() < 1.0
        ]

        # Check if rate limit exceeded
        if (
            len(self.rate_limit_data[customer_id]["requests"])
            >= self.rate_limits[plan_type]
        ):
            self.rate_limit_counter.inc()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for {plan_type} plan",
            )

        # Add current request
        self.rate_limit_data[customer_id]["requests"].append(current_time)
        return True

    async def track_api_call(
        self,
        customer_id: str,
        plan_type: str,
        api_calls_remaining: int,
        service_type: str,
    ) -> bool:
        """Track an API call and check if the customer has exceeded their quota."""
        if api_calls_remaining <= 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="API call quota exceeded"
            )

        # Track the API call
        self.api_calls_counter.inc()

        # Log the API call with service type
        logger.info(
            f"API call tracked - Customer: {customer_id}, Plan: {plan_type}, "
            f"Service: {service_type}, Remaining calls: {api_calls_remaining - 1}"
        )

        return True


def log_metric(name: str) -> None:
    """Log a metric to CloudWatch."""
    try:
        cloudwatch = boto3.client("cloudwatch")
        cloudwatch.put_metric_data(
            Namespace="BleuJS",
            MetricData=[
                {
                    "MetricName": name,
                    "Value": 1,
                    "Unit": "Count",
                    "Dimensions": [{"Name": "Environment", "Value": "production"}],
                }
            ],
        )
    except Exception as e:
        logger.error(f"Error logging metric: {str(e)}")


def log_event(event_type: str) -> None:
    """Log an event to CloudWatch."""
    try:
        cloudwatch = boto3.client("cloudwatch")
        cloudwatch.put_metric_data(
            Namespace="BleuJS",
            MetricData=[
                {
                    "MetricName": f"Event-{event_type}",
                    "Value": 1,
                    "Unit": "Count",
                    "Dimensions": [{"Name": "Environment", "Value": "production"}],
                }
            ],
        )
    except Exception as e:
        logger.error(f"Error logging event: {str(e)}")


def get_metrics(
    start_time: Optional[datetime] = None, end_time: Optional[datetime] = None
):
    try:
        if not start_time:
            start_time = datetime.now(timezone.utc) - timedelta(hours=24)
        if not end_time:
            end_time = datetime.now(timezone.utc)
        # ... existing code ...
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        return []


def get_events(
    start_time: Optional[datetime] = None, end_time: Optional[datetime] = None
):
    try:
        if not start_time:
            start_time = datetime.now(timezone.utc) - timedelta(hours=24)
        if not end_time:
            end_time = datetime.now(timezone.utc)
        # ... existing code ...
    except Exception as e:
        logger.error(f"Error getting events: {str(e)}")
        return []


def cleanup_old_data() -> None:
    """Clean up old data from CloudWatch."""
    try:
        cloudwatch = boto3.client("cloudwatch")
        response = cloudwatch.list_metrics(
            Namespace="BleuJS",
            Dimensions=[{"Name": "Environment", "Value": "production"}],
        )

        for metric in response["Metrics"]:
            cloudwatch.delete_metric(
                Namespace="BleuJS",
                MetricName=metric["MetricName"],
                Dimensions=metric["Dimensions"],
            )
    except Exception as e:
        logger.error(f"Error cleaning up old data: {str(e)}")


def log_alarm(name: str) -> None:
    """Log an alarm to CloudWatch."""
    try:
        cloudwatch = boto3.client("cloudwatch")
        cloudwatch.put_metric_alarm(
            AlarmName=f"{name}-production",
            MetricName=name,
            Namespace="BleuJS",
            Statistic="Sum",
            Period=300,
            EvaluationPeriods=1,
            Threshold=1,
            ComparisonOperator="GreaterThanThreshold",
            AlarmDescription=f"Alarm for {name}",
            Dimensions=[{"Name": "Environment", "Value": "production"}],
        )
    except Exception as e:
        logger.error(f"Error logging alarm: {str(e)}")


async def cleanup_old_metrics() -> None:
    """Clean up old metrics from CloudWatch."""
    try:
        cloudwatch = boto3.client("cloudwatch")
        response = cloudwatch.list_metrics(
            Namespace="BleuJS",
            Dimensions=[{"Name": "Environment", "Value": "production"}],
        )

        for metric in response["Metrics"]:
            cloudwatch.delete_metric(
                Namespace="BleuJS",
                MetricName=metric["MetricName"],
                Dimensions=metric["Dimensions"],
            )
    except Exception as e:
        logger.error(f"Error cleaning up metrics: {str(e)}")

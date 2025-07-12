import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Dict

import aiohttp
import jwt
from fastapi import Depends, HTTPException
from prometheus_client import Counter, Gauge, Histogram
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import APICall, APIUsage, User
from ..quantum_py.intelligence.market_intelligence import MarketIntelligence
from ..quantum_py.intelligence.quantum_intelligence import QuantumIntelligence
from ..quantum_py.intelligence.strategic_intelligence import StrategicIntelligence

# Prometheus metrics
api_calls_total = Counter(
    "api_calls_total", "Total number of API calls", ["endpoint", "status"]
)
api_response_time = Histogram(
    "api_response_time_seconds", "API response time in seconds", ["endpoint"]
)
api_errors_total = Counter(
    "api_errors_total", "Total number of API errors", ["endpoint", "error_type"]
)
active_users = Gauge("active_users", "Number of active users")
api_usage_gauge = Gauge("api_usage", "Current API usage", ["user_id", "plan"])


class APIService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.market_intelligence = MarketIntelligence()
        self.strategic_intelligence = StrategicIntelligence()
        self.quantum_intelligence = QuantumIntelligence()
        self.logger = logging.getLogger(__name__)

    async def validate_api_key(self, api_key: str) -> User:
        """Validate API key and return associated user"""
        try:
            payload = jwt.decode(api_key, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid API key")

            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=401, detail="User not found")

            if not user.is_active:
                raise HTTPException(status_code=401, detail="User account is inactive")

            return user
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid API key")

    async def check_rate_limit(self, user: User) -> bool:
        """Check if user has exceeded rate limit"""
        current_time = datetime.now(timezone.utc)
        recent_calls = (
            self.db.query(APICall)
            .filter(
                APICall.user_id == user.id,
                APICall.timestamp >= current_time - timedelta(minutes=1),
            )
            .count()
        )

        return recent_calls < user.subscription.rate_limit

    async def check_usage_limit(self, user: User) -> bool:
        """Check if user has exceeded monthly usage limit"""
        current_period_start = user.subscription.current_period_start
        current_period_end = user.subscription.current_period_end

        monthly_usage = (
            self.db.query(APIUsage)
            .filter(
                APIUsage.user_id == user.id,
                APIUsage.timestamp >= current_period_start,
                APIUsage.timestamp <= current_period_end,
            )
            .first()
        )

        if not monthly_usage:
            return True

        return monthly_usage.calls_count < user.subscription.api_calls_limit

    async def track_api_call(
        self, user: User, endpoint: str, response_time: float, status: int
    ):
        """Track API call metrics"""
        # Update Prometheus metrics
        api_calls_total.labels(endpoint=endpoint, status=str(status)).inc()
        api_response_time.labels(endpoint=endpoint).observe(response_time)
        if status >= 400:
            api_errors_total.labels(endpoint=endpoint, error_type=str(status)).inc()

        # Update database
        api_call = APICall(
            user_id=user.id,
            endpoint=endpoint,
            response_time=response_time,
            status=status,
            timestamp=datetime.now(timezone.utc),
        )
        self.db.add(api_call)

        # Update monthly usage
        monthly_usage = (
            self.db.query(APIUsage)
            .filter(
                APIUsage.user_id == user.id,
                APIUsage.timestamp >= user.subscription.current_period_start,
                APIUsage.timestamp <= user.subscription.current_period_end,
            )
            .first()
        )

        if not monthly_usage:
            monthly_usage = APIUsage(
                user_id=user.id, calls_count=0, timestamp=datetime.now(timezone.utc)
            )
            self.db.add(monthly_usage)

        monthly_usage.calls_count += 1
        self.db.commit()

        # Update Prometheus gauge
        api_usage_gauge.labels(
            user_id=str(user.id), plan=user.subscription.plan_type
        ).set(monthly_usage.calls_count)

    async def get_usage_analytics(self, user: User) -> Dict:
        """Get detailed usage analytics for user"""
        current_period_start = user.subscription.current_period_start
        current_period_end = user.subscription.current_period_end

        # Get daily usage
        daily_usage = (
            self.db.query(APICall)
            .filter(
                APICall.user_id == user.id,
                APICall.timestamp >= current_period_start,
                APICall.timestamp <= current_period_end,
            )
            .all()
        )

        # Calculate response time distribution
        response_times = [call.response_time for call in daily_usage]
        response_time_distribution = {
            "<100ms": len([t for t in response_times if t < 0.1]),
            "100-200ms": len([t for t in response_times if 0.1 <= t < 0.2]),
            "200-300ms": len([t for t in response_times if 0.2 <= t < 0.3]),
            "300-400ms": len([t for t in response_times if 0.3 <= t < 0.4]),
            ">400ms": len([t for t in response_times if t >= 0.4]),
        }

        # Get endpoint usage
        endpoint_usage = {}
        for call in daily_usage:
            endpoint_usage[call.endpoint] = endpoint_usage.get(call.endpoint, 0) + 1

        # Get error rates
        error_calls = [call for call in daily_usage if call.status >= 400]
        error_rate = len(error_calls) / len(daily_usage) if daily_usage else 0

        return {
            "total_calls": len(daily_usage),
            "response_time_distribution": response_time_distribution,
            "endpoint_usage": endpoint_usage,
            "error_rate": error_rate,
            "average_response_time": (
                sum(response_times) / len(response_times) if response_times else 0
            ),
        }

    async def get_advanced_analytics(self, user: User) -> Dict:
        """Get advanced analytics for enterprise users"""
        if user.subscription.plan_type != "ENTERPRISE":
            raise HTTPException(
                status_code=403,
                detail="Advanced analytics only available for Enterprise plan",
            )

        # Get market intelligence
        market_data = await self.market_intelligence.get_market_analysis()

        # Get strategic insights
        strategic_insights = await self.strategic_intelligence.get_strategic_insights()

        # Get quantum analysis
        quantum_analysis = await self.quantum_intelligence.get_quantum_analysis()

        return {
            "market_intelligence": market_data,
            "strategic_insights": strategic_insights,
            "quantum_analysis": quantum_analysis,
        }

    async def get_user_dashboard_data(self, user: User) -> Dict:
        """Get all dashboard data for user"""
        usage_analytics = await self.get_usage_analytics(user)

        dashboard_data = {
            "user": {
                "email": user.email,
                "plan_type": user.subscription.plan_type,
                "api_key": user.api_key,
            },
            "subscription": {
                "current_period_start": user.subscription.current_period_start,
                "current_period_end": user.subscription.current_period_end,
                "api_calls_limit": user.subscription.api_calls_limit,
                "rate_limit": user.subscription.rate_limit,
            },
            "usage": {
                "calls_remaining": user.subscription.api_calls_limit
                - usage_analytics["total_calls"],
                "current_usage": usage_analytics["total_calls"],
                "response_time_distribution": usage_analytics[
                    "response_time_distribution"
                ],
                "endpoint_usage": usage_analytics["endpoint_usage"],
                "error_rate": usage_analytics["error_rate"],
                "average_response_time": usage_analytics["average_response_time"],
            },
        }

        # Add advanced analytics for enterprise users
        if user.subscription.plan_type == "ENTERPRISE":
            advanced_analytics = await self.get_advanced_analytics(user)
            dashboard_data["advanced_analytics"] = advanced_analytics

        return dashboard_data

    async def monitor_api_health(self) -> Dict:
        """Monitor overall API health"""
        # Get system metrics
        system_metrics = {
            "uptime": time.time() - self.start_time,
            "active_users": active_users._value.get(),
            "total_api_calls": api_calls_total._value.get(),
            "error_rate": (
                api_errors_total._value.get() / api_calls_total._value.get()
                if api_calls_total._value.get() > 0
                else 0
            ),
        }

        # Get database health
        try:
            self.db.execute("SELECT 1")
            db_health = "healthy"
        except Exception as e:
            db_health = "unhealthy"
            self.logger.error(f"Database health check failed: {str(e)}")

        # Get external service health
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    settings.QUANTUM_SERVICE_URL + "/health"
                ) as response:
                    quantum_health = (
                        "healthy" if response.status == 200 else "unhealthy"
                    )
            except Exception as e:
                quantum_health = "unhealthy"
                self.logger.error(f"Quantum service health check failed: {str(e)}")

        return {
            "system_metrics": system_metrics,
            "database_health": db_health,
            "quantum_service_health": quantum_health,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def optimize_api_performance(self) -> Dict:
        """Optimize API performance based on usage patterns"""
        # Get recent API calls
        recent_calls = (
            self.db.query(APICall)
            .filter(
                APICall.timestamp >= datetime.now(timezone.utc) - timedelta(hours=24)
            )
            .all()
        )

        # Analyze response times
        response_times = [call.response_time for call in recent_calls]
        avg_response_time = (
            sum(response_times) / len(response_times) if response_times else 0
        )

        # Identify slow endpoints
        endpoint_times = {}
        for call in recent_calls:
            if call.endpoint not in endpoint_times:
                endpoint_times[call.endpoint] = []
            endpoint_times[call.endpoint].append(call.response_time)

        slow_endpoints = {
            endpoint: sum(times) / len(times)
            for endpoint, times in endpoint_times.items()
            if sum(times) / len(times) > avg_response_time * 1.5
        }

        # Generate optimization recommendations
        recommendations = []
        for endpoint, avg_time in slow_endpoints.items():
            if avg_time > 1.0:  # More than 1 second
                recommendations.append(
                    {
                        "endpoint": endpoint,
                        "issue": "High response time",
                        "recommendation": "Implement caching and optimize "
                        "database queries",
                    }
                )
            elif avg_time > 0.5:  # More than 500ms
                recommendations.append(
                    {
                        "endpoint": endpoint,
                        "issue": "Moderate response time",
                        "recommendation": "Consider implementing request batching",
                    }
                )

        return {
            "average_response_time": avg_response_time,
            "slow_endpoints": slow_endpoints,
            "recommendations": recommendations,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

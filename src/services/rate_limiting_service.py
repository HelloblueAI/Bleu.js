from datetime import datetime, timedelta, timezone
import asyncio
import logging
from typing import Dict, Optional
from src.models.customer import Customer, RateLimitToken
from src.database import get_db
from sqlalchemy.orm import Session
from src.models.subscription import Subscription
from src.models.rate_limit import RateLimit
import uuid

logger = logging.getLogger(__name__)


class RateLimitingService:
    def __init__(self, db: Session = None):
        self.token_buckets: Dict[str, Dict] = {}
        self.lock = asyncio.Lock()
        self.db = db

    async def check_rate_limit(self, user_id: str, endpoint: str) -> bool:
        try:
            # Get customer's rate limit
            customer = self.db.query(Customer).filter(Customer.id == user_id).first()
            if not customer:
                return False

            # Get existing rate limit record
            rate_limit = self.db.query(RateLimit).filter(
                RateLimit.user_id == user_id,
                RateLimit.endpoint == endpoint
            ).first()

            current_time = datetime.now(timezone.utc)

            if not rate_limit:
                # Create new rate limit record
                rate_limit = RateLimit(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    endpoint=endpoint,
                    limit=customer.rate_limit,  # Use customer's rate limit
                    period=3600,  # Default period (1 hour)
                    calls_count=1,
                    last_reset=current_time,
                    current_period_start=current_time,
                    last_used=current_time
                )
                self.db.add(rate_limit)
                self.db.commit()
                return True

            # Check if we need to reset the counter
            last_reset_utc = rate_limit.last_reset.replace(tzinfo=timezone.utc)
            if (current_time - last_reset_utc) >= timedelta(seconds=rate_limit.period):
                rate_limit.calls_count = 1
                rate_limit.last_reset = current_time
                rate_limit.current_period_start = current_time
                rate_limit.last_used = current_time
                self.db.commit()
                return True

            # Check if limit is exceeded
            if rate_limit.calls_count + 1 > rate_limit.limit:
                return False

            # Increment counter
            rate_limit.calls_count += 1
            rate_limit.last_used = current_time
            self.db.commit()
            return True

        except Exception as e:
            logging.error(f"Error checking rate limit: {str(e)}")
            return False

    async def _get_or_create_bucket(self, customer: Customer) -> Dict:
        """Get or create a token bucket for the customer."""
        if customer.id not in self.token_buckets:
            # Get existing bucket from database
            db_bucket = (
                self.db.query(RateLimitToken)
                .filter(RateLimitToken.customer_id == customer.id)
                .first()
            )

            if db_bucket:
                self.token_buckets[customer.id] = {
                    "tokens": db_bucket.tokens,
                    "next_refill": db_bucket.last_updated
                    + timedelta(seconds=customer.rate_limit),
                }
            else:
                # Create new bucket
                self.token_buckets[customer.id] = {
                    "tokens": customer.rate_limit,
                    "next_refill": datetime.now(timezone.utc)
                    + timedelta(seconds=customer.rate_limit),
                }

        return self.token_buckets[customer.id]

    async def _refill_tokens(self, customer: Customer):
        """Refill the token bucket for the customer."""
        bucket = self.token_buckets[customer.id]
        bucket["tokens"] = customer.rate_limit
        bucket["next_refill"] = datetime.now(timezone.utc) + timedelta(
            seconds=customer.rate_limit
        )
        await self._update_token_bucket(customer, bucket)

    async def _update_token_bucket(self, customer: Customer, bucket: Dict):
        """Update the token bucket in the database."""
        try:
            db_bucket = (
                self.db.query(RateLimitToken)
                .filter(RateLimitToken.customer_id == customer.id)
                .first()
            )

            if db_bucket:
                db_bucket.tokens = bucket["tokens"]
                db_bucket.last_updated = datetime.now(timezone.utc)
            else:
                db_bucket = RateLimitToken(
                    customer_id=customer.id,
                    tokens=bucket["tokens"],
                    last_updated=datetime.now(timezone.utc),
                )
                self.db.add(db_bucket)

            self.db.commit()

        except Exception as e:
            logger.error(f"Error updating token bucket: {str(e)}")
            raise

    async def get_remaining_tokens(self, customer_id: str) -> Optional[int]:
        """Get the number of remaining tokens for a customer."""
        async with self.lock:
            try:
                customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
                if not customer:
                    return None

                bucket = await self._get_or_create_bucket(customer)
                return bucket["tokens"]

            except Exception as e:
                logger.error(f"Error getting remaining tokens: {str(e)}")
                return None

    @staticmethod
    async def _handle_rate_limit_reset(rate_limit: RateLimit, now: datetime) -> None:
        """Intelligently handle rate limit resets for both monthly and per-second limits.
        
        This method:
        1. Checks if monthly reset is needed
        2. Handles per-second rate limit resets
        3. Updates all relevant timestamps
        """
        last_reset_utc = rate_limit.last_reset.replace(tzinfo=timezone.utc)
        last_used_utc = rate_limit.last_used.replace(tzinfo=timezone.utc)
        
        # Check monthly reset
        if now - last_reset_utc > timedelta(days=30):
            rate_limit.calls_count = 1  # Start with 1 for this request
            rate_limit.last_reset = now
            rate_limit.current_period_start = now
            rate_limit.last_used = now
            rate_limit.rate_limit_count = 1  # Reset per-second counter too
            return
        
        # Check per-second reset
        if (now - last_used_utc).total_seconds() >= 1:
            rate_limit.rate_limit_count = 1  # Reset per-second counter
            rate_limit.last_used = now

    @staticmethod
    async def check_rate_limit_user(user_id: str, db: Session, endpoint: str = "default") -> bool:
        """Check if the user has exceeded their rate limits.
        
        This method checks both:
        1. Monthly API call limits (subscription-based)
        2. Per-second rate limits (burst protection)
        """
        subscription = (
            db.query(Subscription).filter(Subscription.user_id == user_id).first()
        )
        if not subscription:
            return False

        # Get or create rate limit record
        rate_limit = db.query(RateLimit).filter(
            RateLimit.user_id == user_id,
            RateLimit.endpoint == endpoint
        ).first()

        now = datetime.now(timezone.utc)

        if not rate_limit:
            # Create new rate limit record with both limits
            rate_limit = RateLimit(
                id=str(uuid.uuid4()),
                user_id=user_id,
                endpoint=endpoint,
                limit=subscription.plan.api_calls_limit,  # Monthly limit
                period=30 * 24 * 60 * 60,  # 30 days in seconds
                calls_count=1,  # Start with 1 for this request
                last_reset=now,
                current_period_start=now,
                last_used=now,
                rate_limit=subscription.plan.rate_limit,  # Per-second rate limit
                rate_limit_period=1,  # 1 second
                rate_limit_count=1  # Start with 1 for this request
            )
            db.add(rate_limit)
            db.commit()
            return True

        # Handle rate limit resets
        await RateLimitingService._handle_rate_limit_reset(rate_limit, now)

        # Check if monthly limit has been reached
        if rate_limit.calls_count >= subscription.plan.api_calls_limit:
            return False  # Monthly limit has been reached

        # Check per-second rate limit
        if rate_limit.rate_limit_count >= rate_limit.rate_limit:
            return False  # Per-second rate limit exceeded

        # Increment counters and allow request
        rate_limit.calls_count += 1
        rate_limit.rate_limit_count += 1
        rate_limit.last_used = now
        db.commit()
        return True

    @staticmethod
    async def increment_rate_limit_user(user_id: str, db: Session) -> None:
        """Increment the rate limit counter for a user."""
        rate_limit = db.query(RateLimit).filter(RateLimit.user_id == user_id).first()
        if rate_limit:
            rate_limit.calls_count += 1
            rate_limit.last_used = datetime.now(timezone.utc)
            db.commit()

    @staticmethod
    async def get_rate_limit_status_user(user_id: str, db: Session) -> Dict:
        """Get the current rate limit status for a user."""
        subscription = (
            db.query(Subscription).filter(Subscription.user_id == user_id).first()
        )
        rate_limit = db.query(RateLimit).filter(RateLimit.user_id == user_id).first()

        if not subscription or not rate_limit:
            return {
                "monthly_calls_remaining": 0,
                "monthly_total_calls": 0,
                "monthly_reset_time": datetime.now(timezone.utc) + timedelta(days=30),
                "rate_limit": subscription.plan.rate_limit if subscription else 0,
                "rate_limit_period": 1  # 1 second
            }

        monthly_calls_remaining = max(
            0, subscription.plan.api_calls_limit - rate_limit.calls_count
        )
        monthly_reset_time = rate_limit.last_reset + timedelta(days=30)

        return {
            "monthly_calls_remaining": monthly_calls_remaining,
            "monthly_total_calls": rate_limit.calls_count,
            "monthly_reset_time": monthly_reset_time,
            "rate_limit": subscription.plan.rate_limit,
            "rate_limit_period": 1  # 1 second
        }

    @staticmethod
    async def reset_rate_limit_user(user_id: str, db: Session) -> None:
        """Reset the rate limit counter for a user."""
        rate_limit = db.query(RateLimit).filter(RateLimit.user_id == user_id).first()
        if rate_limit:
            rate_limit.calls_count = 0
            rate_limit.last_reset = datetime.now(timezone.utc)
            rate_limit.current_period_start = datetime.now(timezone.utc)
            db.commit()

    @staticmethod
    async def setup_rate_limit(customer_id: str, rate_limit: int, rate_limit_period: int, db: Session, endpoint: str = None) -> None:
        """Set up rate limiting for a customer."""
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return

        rate_limit_record = RateLimit(
            user_id=customer_id,
            calls_count=0,
            last_reset=datetime.now(timezone.utc),
            current_period_start=datetime.now(timezone.utc),
            endpoint=endpoint,
            limit=rate_limit,
            period=rate_limit_period
        )
        db.add(rate_limit_record)
        db.commit()

    @staticmethod
    async def increment_rate_limit(customer_id: str, db: Session, endpoint: str = None) -> None:
        """Increment the rate limit counter for a customer."""
        rate_limit = db.query(RateLimit).filter(
            RateLimit.user_id == customer_id,
            RateLimit.endpoint == endpoint
        ).first()
        if rate_limit:
            rate_limit.calls_count += 1
            rate_limit.last_used = datetime.now(timezone.utc)
            db.commit()

    @staticmethod
    async def get_rate_limit_status(customer_id: str, db: Session, endpoint: str = None) -> Dict:
        """Get the current rate limit status for a customer."""
        rate_limit = db.query(RateLimit).filter(
            RateLimit.user_id == customer_id,
            RateLimit.endpoint == endpoint
        ).first()

        if not rate_limit:
            return {
                "calls_remaining": 0,
                "total_calls": 0,
                "reset_time": datetime.now(timezone.utc) + timedelta(minutes=1),
            }

        calls_remaining = max(0, rate_limit.limit - rate_limit.calls_count)
        reset_time = rate_limit.last_reset + timedelta(seconds=rate_limit.period)

        return {
            "calls_remaining": calls_remaining,
            "total_calls": rate_limit.calls_count,
            "reset_time": reset_time,
        }

    @staticmethod
    async def get_rate_limit(customer_id: str, db: Session, endpoint: str = None) -> Optional[RateLimit]:
        """Get the rate limit record for a customer."""
        return db.query(RateLimit).filter(
            RateLimit.user_id == customer_id,
            RateLimit.endpoint == endpoint
        ).first()

    @staticmethod
    async def get_detailed_usage_stats(user_id: str, db: Session) -> Dict:
        """Get detailed usage statistics for a user.
        
        Returns:
            Dict containing:
            - Monthly usage stats
            - Per-second rate limit stats
            - Usage patterns
            - Reset times
        """
        subscription = (
            db.query(Subscription).filter(Subscription.user_id == user_id).first()
        )
        rate_limits = db.query(RateLimit).filter(RateLimit.user_id == user_id).all()

        if not subscription:
            return {
                "error": "No subscription found",
                "monthly_stats": {
                    "calls_remaining": 0,
                    "total_calls": 0,
                    "reset_time": datetime.now(timezone.utc) + timedelta(days=30),
                },
                "rate_limit_stats": {
                    "current_rate": 0,
                    "rate_limit": 0,
                    "next_reset": datetime.now(timezone.utc) + timedelta(seconds=1),
                },
                "usage_patterns": {
                    "endpoints": {},
                    "total_endpoints": 0,
                }
            }

        # Calculate total monthly calls across all endpoints
        total_monthly_calls = sum(rl.calls_count for rl in rate_limits)
        monthly_calls_remaining = max(0, subscription.plan.api_calls_limit - total_monthly_calls)

        # Get the earliest reset time
        earliest_reset = min(
            (rl.last_reset + timedelta(days=30) for rl in rate_limits),
            default=datetime.now(timezone.utc) + timedelta(days=30)
        )

        # Get endpoint-specific usage patterns
        endpoint_usage = {}
        for rl in rate_limits:
            endpoint_usage[rl.endpoint] = {
                "calls": rl.calls_count,
                "rate_limit": rl.rate_limit,
                "current_rate": rl.rate_limit_count,
                "last_used": rl.last_used,
                "next_reset": rl.last_used + timedelta(seconds=1)
            }

        return {
            "monthly_stats": {
                "calls_remaining": monthly_calls_remaining,
                "total_calls": total_monthly_calls,
                "reset_time": earliest_reset,
                "limit": subscription.plan.api_calls_limit,
            },
            "rate_limit_stats": {
                "current_rate": max((rl.rate_limit_count for rl in rate_limits), default=0),
                "rate_limit": subscription.plan.rate_limit,
                "next_reset": datetime.now(timezone.utc) + timedelta(seconds=1),
            },
            "usage_patterns": {
                "endpoints": endpoint_usage,
                "total_endpoints": len(rate_limits),
            },
            "subscription": {
                "plan": subscription.plan.name,
                "type": subscription.plan.plan_type.value,
            }
        }


# Create a singleton instance
rate_limiting_service = RateLimitingService()

import uuid
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from src.models.declarative_base import Base


class RateLimit(Base):
    """Database model for storing rate limit information."""

    __tablename__ = "rate_limits"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    endpoint = Column(String, nullable=False)
    limit = Column(Integer, nullable=False)  # Monthly API call limit
    period = Column(Integer, nullable=False)  # Period in seconds (30 days)
    calls_count = Column(Integer, nullable=False, default=0)  # Monthly calls count
    last_reset = Column(DateTime, nullable=False)
    current_period_start = Column(DateTime, nullable=False)
    last_used = Column(DateTime, nullable=False)

    # Per-second rate limiting fields
    rate_limit = Column(Integer, nullable=False)  # Rate limit per second
    rate_limit_period = Column(
        Integer, nullable=False, default=1
    )  # Rate limit period in seconds
    rate_limit_count = Column(
        Integer, nullable=False, default=0
    )  # Current rate limit count

    # Relationships
    user = relationship("User", back_populates="rate_limits")
    customer = relationship("Customer", back_populates="rate_limits")

    def reset_if_needed(self):
        """Reset the rate limit counter if the period has elapsed."""
        now = datetime.now(timezone.utc)
        if (now - self.last_reset).total_seconds() >= self.period:
            self.calls_count = 0
            self.last_reset = now
            self.current_period_start = now

    def increment(self):
        """Increment the number of calls made."""
        self.calls_count += 1
        self.last_used = datetime.now(timezone.utc)


# Pydantic models for API
class RateLimitBase(BaseModel):
    user_id: str
    customer_id: Optional[str] = None
    endpoint: str
    limit: int
    period: int
    rate_limit: int
    rate_limit_period: int = 1
    rate_limit_count: int = 0

    model_config = ConfigDict(arbitrary_types_allowed=True)


class RateLimitCreate(RateLimitBase):
    pass


class RateLimitResponse(RateLimitBase):
    id: str
    calls_count: int
    last_reset: datetime
    current_period_start: datetime
    last_used: datetime

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)

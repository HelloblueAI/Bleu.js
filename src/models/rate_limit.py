from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from src.models.declarative_base import Base
import uuid


class RateLimit(Base):
    """Database model for storing rate limit information."""

    __tablename__ = "rate_limits"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    endpoint = Column(String, nullable=False)
    limit = Column(Integer, nullable=False)  # Monthly API call limit
    period = Column(Integer, nullable=False)  # Period in seconds (30 days)
    calls_count = Column(Integer, nullable=False, default=0)  # Monthly calls count
    last_reset = Column(DateTime, nullable=False)
    current_period_start = Column(DateTime, nullable=False)
    last_used = Column(DateTime, nullable=False)
    
    # Per-second rate limiting fields
    rate_limit = Column(Integer, nullable=False)  # Rate limit per second
    rate_limit_period = Column(Integer, nullable=False, default=1)  # Rate limit period in seconds
    rate_limit_count = Column(Integer, nullable=False, default=0)  # Current rate limit count

    # Relationships
    user = relationship("User", back_populates="rate_limits")

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
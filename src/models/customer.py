import uuid
from datetime import datetime, timezone
from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from src.models.declarative_base import Base


class Customer(Base):
    """Database model for storing customer information."""

    __tablename__ = "customers"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    stripe_customer_id = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    api_key = Column(String, unique=True, nullable=False)
    plan = Column(String, nullable=False)
    features = Column(JSON, nullable=False)
    api_calls_remaining = Column(Integer, default=0)
    rate_limit = Column(Integer, nullable=False)
    subscription_start = Column(DateTime, nullable=False)
    subscription_end = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    subscription_id = Column(String, ForeignKey("subscriptions.id"), nullable=True)
    api_calls_reset_at = Column(DateTime, nullable=True)
    settings = Column(JSON, default={})

    # Relationships
    api_calls = relationship("APICall", back_populates="customer")
    rate_limit_tokens = relationship(
        "RateLimitToken", back_populates="customer", uselist=False
    )
    subscription = relationship("Subscription", back_populates="customer")
    api_tokens = relationship("APIToken", back_populates="customer")
    rate_limits = relationship("RateLimit", back_populates="customer")
    payments = relationship("Payment", back_populates="customer")

    def reset_api_calls(self):
        """Reset the API calls counter."""
        self.api_calls_remaining = self.subscription.plan.api_calls_limit
        self.api_calls_reset_at = datetime.now(timezone.utc)

    def can_make_api_call(self) -> bool:
        """Check if the customer can make an API call."""
        if not self.api_calls_reset_at:
            return False

        # Reset if the period has elapsed
        now = datetime.now(timezone.utc)
        if (now - self.api_calls_reset_at).days >= 30:  # Monthly reset
            self.reset_api_calls()

        return self.api_calls_remaining > 0

    def decrement_api_calls(self):
        """Decrement the API calls counter."""
        if self.can_make_api_call():
            self.api_calls_remaining -= 1
            self.updated_at = datetime.now(timezone.utc)
            return True
        return False


class RateLimitToken(Base):
    """Database model for managing rate limiting tokens."""

    __tablename__ = "rate_limit_tokens"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True)
    customer_id = Column(
        String, ForeignKey("customers.id"), unique=True, nullable=False
    )
    tokens = Column(Integer, nullable=False)
    last_updated = Column(DateTime, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="rate_limit_tokens")


# Pydantic models for API
class CustomerBase(BaseModel):
    email: EmailStr
    plan: str
    features: Dict
    api_calls_remaining: int
    rate_limit: int

    model_config = ConfigDict(arbitrary_types_allowed=True)


class CustomerCreate(CustomerBase):
    stripe_customer_id: str
    api_key: str
    subscription_start: datetime

    model_config = ConfigDict(arbitrary_types_allowed=True)


class CustomerUpdate(BaseModel):
    plan: Optional[str] = None
    features: Optional[Dict] = None
    api_calls_remaining: Optional[int] = None
    rate_limit: Optional[int] = None
    is_active: Optional[bool] = None
    subscription_end: Optional[datetime] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


class CustomerResponse(CustomerBase):
    id: str
    stripe_customer_id: str
    api_key: str
    subscription_start: datetime
    subscription_end: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)

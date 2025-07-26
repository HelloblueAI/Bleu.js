"""Subscription model."""

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from src.models.base import Base


class PlanType(str, Enum):
    """Subscription plan types."""

    COR_E = "cor-e"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, Enum):
    """Subscription status types."""

    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    PENDING = "pending"


class APIToken(Base):
    """API Token model."""

    __tablename__ = "api_tokens"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    token_hash = Column(String(255), nullable=False, unique=True)
    is_active = Column(String(10), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="api_tokens")

    def __repr__(self):
        return f"<APIToken(id={self.id}, name='{self.name}', user_id={self.user_id})>"

    def to_dict(self):
        """Convert API token to dictionary."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "name": self.name,
            "token_hash": self.token_hash,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class SubscriptionPlan(Base):
    """Subscription plan model."""

    __tablename__ = "subscription_plans"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    plan_type = Column(String(50), nullable=False)
    price = Column(Integer, nullable=False)  # Price in cents
    api_calls_limit = Column(Integer, nullable=False)
    features = Column(Text, nullable=True)  # JSON string of features
    is_active = Column(String(10), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")

    def __repr__(self):
        return (
            f"<SubscriptionPlan(id={self.id}, name='{self.name}', "
            f"plan_type='{self.plan_type}')>"
        )


class Subscription(Base):
    """Subscription model."""

    __tablename__ = "subscriptions"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    plan_id = Column(String(36), ForeignKey("subscription_plans.id"), nullable=False)
    status = Column(String(50), default="active")
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    api_calls_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="subscriptions")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")

    def __repr__(self):
        return (
            f"<Subscription(id={self.id}, user_id={self.user_id}, "
            f"status='{self.status}')>"
        )

    def to_dict(self):
        """Convert subscription to dictionary."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "plan_id": str(self.plan_id),
            "status": self.status,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "api_calls_used": self.api_calls_used,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# Pydantic models for API
class APITokenBase(BaseModel):
    """Base API token model."""

    name: str

    model_config = ConfigDict(from_attributes=True)


class APITokenCreate(APITokenBase):
    """API token creation model."""

    pass


class APITokenUpdate(BaseModel):
    """API token update model."""

    name: str | None = None
    is_active: str | None = None

    model_config = ConfigDict(from_attributes=True)


class APITokenResponse(APITokenBase):
    """API token response model."""

    id: str
    user_id: str
    token_hash: str
    is_active: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SubscriptionPlanBase(BaseModel):
    """Base subscription plan model."""

    name: str
    plan_type: PlanType
    price: int
    api_calls_limit: int
    features: str | None = None

    model_config = ConfigDict(from_attributes=True)


class SubscriptionPlanCreate(SubscriptionPlanBase):
    """Subscription plan creation model."""

    pass


class SubscriptionPlanUpdate(BaseModel):
    """Subscription plan update model."""

    name: str | None = None
    plan_type: PlanType | None = None
    price: int | None = None
    api_calls_limit: int | None = None
    features: str | None = None
    is_active: str | None = None

    model_config = ConfigDict(from_attributes=True)


class SubscriptionPlanResponse(SubscriptionPlanBase):
    """Subscription plan response model."""

    id: str
    is_active: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SubscriptionBase(BaseModel):
    """Base subscription model."""

    user_id: str
    plan_id: str
    status: SubscriptionStatus
    start_date: datetime
    end_date: datetime | None = None
    api_calls_used: int = 0

    model_config = ConfigDict(from_attributes=True)


class SubscriptionCreate(SubscriptionBase):
    """Subscription creation model."""

    pass


class SubscriptionUpdate(BaseModel):
    """Subscription update model."""

    plan_id: str | None = None
    status: SubscriptionStatus | None = None
    end_date: datetime | None = None
    api_calls_used: int | None = None

    model_config = ConfigDict(from_attributes=True)


class SubscriptionResponse(SubscriptionBase):
    """Subscription response model."""

    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

import enum
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from src.models.declarative_base import Base


class PlanType(str, enum.Enum):
    FREE = "FREE"
    CORE = "CORE"
    ENTERPRISE = "ENTERPRISE"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    TRIAL = "trial"


class Subscription(Base):
    """Database model for user subscriptions."""

    __tablename__ = "subscriptions"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    plan_id = Column(String, ForeignKey("subscription_plans.id"), nullable=False)
    stripe_subscription_id = Column(String, nullable=True)
    status = Column(
        Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.TRIAL
    )
    current_period_start = Column(DateTime(timezone=True), nullable=False)
    current_period_end = Column(DateTime(timezone=True), nullable=False)
    api_calls_remaining = Column(Integer, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="subscription")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")
    api_tokens = relationship(
        "APIToken", back_populates="subscription", cascade="all, delete-orphan"
    )
    customer = relationship("Customer", back_populates="subscription", uselist=False)


class APIToken(Base):
    """Database model for storing API tokens."""

    __tablename__ = "api_tokens"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    subscription_id = Column(String, ForeignKey("subscriptions.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    name = Column(String, nullable=False)
    token = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_used_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="api_tokens")
    subscription = relationship("Subscription", back_populates="api_tokens")
    customer = relationship("Customer", back_populates="api_tokens")


class SubscriptionPlan(Base):
    """Database model for subscription plans."""

    __tablename__ = "subscription_plans"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    plan_type = Column(Enum(PlanType), nullable=False)
    price = Column(Integer, nullable=False)  # Price in cents
    api_calls_limit = Column(Integer, nullable=False)
    rate_limit = Column(Integer, nullable=False)  # Rate limit per second
    uptime_sla = Column(String, nullable=False)
    support_level = Column(String, nullable=False)
    features = Column(JSON, nullable=False)
    trial_days = Column(Integer, nullable=False, default=30)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")

    @staticmethod
    def get_core_plan():
        return {
            "name": "COR-E Plan",
            "plan_type": PlanType.CORE,
            "price": 2900,  # $29/month
            "api_calls_limit": 100,
            "rate_limit": 10,  # 10 requests per second
            "uptime_sla": "99.9%",
            "support_level": "standard",
            "features": {
                "core_ai_model_access": True,
                "basic_analytics": True,
                "email_support": True,
                "api_documentation": True,
                "standard_response_time": True,
            },
            "trial_days": 14,
        }

    @staticmethod
    def get_enterprise_plan():
        return {
            "name": "Enterprise Plan",
            "plan_type": PlanType.ENTERPRISE,
            "price": 49900,  # $499/month
            "api_calls_limit": 5000,
            "rate_limit": 100,  # 100 requests per second
            "uptime_sla": "99.99%",
            "support_level": "premium",
            "features": {
                "core_ai_model_access": True,
                "advanced_analytics": True,
                "priority_support": True,
                "dedicated_account_manager": True,
                "custom_model_training": True,
                "custom_integrations": True,
                "sla_guarantees": True,
                "advanced_documentation": True,
            },
            "trial_days": 30,
        }


# Pydantic models for API
class APITokenBase(BaseModel):
    name: str
    expires_at: Optional[datetime] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


class APITokenCreate(APITokenBase):
    pass


class APITokenResponse(APITokenBase):
    id: str
    user_id: str
    token: str
    is_active: bool
    last_used_at: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


class SubscriptionPlanBase(BaseModel):
    name: str
    plan_type: PlanType
    price: int
    api_calls_limit: int
    trial_days: int
    features: Dict
    rate_limit: int
    uptime_sla: str
    support_level: str

    model_config = ConfigDict(arbitrary_types_allowed=True)


class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass


class SubscriptionPlanResponse(SubscriptionPlanBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)


class SubscriptionBase(BaseModel):
    user_id: str
    plan_id: str
    stripe_subscription_id: Optional[str] = None
    status: str
    current_period_start: datetime
    current_period_end: datetime
    trial_end_date: Optional[datetime]
    api_calls_remaining: int

    model_config = ConfigDict(arbitrary_types_allowed=True)


class SubscriptionCreate(BaseModel):
    tier: str
    payment_method_id: str

    model_config = ConfigDict(arbitrary_types_allowed=True)


class SubscriptionResponse(SubscriptionBase):
    id: str
    created_at: datetime
    updated_at: datetime
    plan: SubscriptionPlanResponse

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)

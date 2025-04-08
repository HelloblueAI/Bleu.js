"""Payment model implementation."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .declarative_base import Base


class Payment(Base):
    """Payment model for tracking customer payments."""

    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    status = Column(String(20), nullable=False)
    payment_method = Column(String(50), nullable=False)
    transaction_id = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    customer = relationship("Customer", back_populates="payments")

    def __init__(
        self,
        customer_id: int,
        amount: float,
        transaction_id: str,
        currency: str = "USD",
        status: str = "pending",
        payment_method: str = "credit_card",
    ):
        """Initialize a new payment.

        Args:
            customer_id: ID of the customer making the payment
            amount: Payment amount
            transaction_id: Unique transaction identifier
            currency: Payment currency (default: USD)
            status: Payment status (default: pending)
            payment_method: Payment method used
        """
        self.customer_id = customer_id
        self.amount = amount
        self.transaction_id = transaction_id
        self.currency = currency
        self.status = status
        self.payment_method = payment_method

    def __repr__(self) -> str:
        """Return string representation of the payment."""
        return f"<Payment(id={self.id}, customer_id={self.customer_id}, amount={self.amount}, status={self.status})>"

    def to_dict(self) -> dict:
        """Convert payment to dictionary."""
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status,
            "payment_method": self.payment_method,
            "transaction_id": self.transaction_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


# Pydantic models for API
class PaymentBase(BaseModel):
    customer_id: int
    amount: float
    currency: str = "USD"
    status: str = "pending"
    payment_method: str = "credit_card"
    transaction_id: str

    model_config = ConfigDict(arbitrary_types_allowed=True)


class PaymentCreate(PaymentBase):
    pass


class PaymentResponse(PaymentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)

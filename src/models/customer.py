"""Customer model."""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.models.base import Base


class Customer(Base):
    """Customer model."""

    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(String(10), default="active")
    notes = Column(Text, nullable=True)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="customer")
    payments = relationship("Payment", back_populates="customer")

    def __repr__(self):
        return f"<Customer(id={self.id}, email='{self.email}')>"

    def to_dict(self):
        """Convert customer to dictionary."""
        return {
            "id": str(self.id),
            "email": self.email,
            "name": self.name,
            "company": self.company,
            "phone": self.phone,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "country": self.country,
            "postal_code": self.postal_code,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_active": self.is_active,
            "notes": self.notes,
        }


class CustomerCreate:
    """Customer creation model."""

    def __init__(
        self,
        email: str,
        name: str | None = None,
        company: str | None = None,
        phone: str | None = None,
        address: str | None = None,
        city: str | None = None,
        state: str | None = None,
        country: str | None = None,
        postal_code: str | None = None,
        notes: str | None = None,
    ):
        self.email = email
        self.name = name
        self.company = company
        self.phone = phone
        self.address = address
        self.city = city
        self.state = state
        self.country = country
        self.postal_code = postal_code
        self.notes = notes

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "email": self.email,
            "name": self.name,
            "company": self.company,
            "phone": self.phone,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "country": self.country,
            "postal_code": self.postal_code,
            "notes": self.notes,
        }


class CustomerUpdate:
    """Customer update model."""

    def __init__(
        self,
        email: str | None = None,
        name: str | None = None,
        company: str | None = None,
        phone: str | None = None,
        address: str | None = None,
        city: str | None = None,
        state: str | None = None,
        country: str | None = None,
        postal_code: str | None = None,
        notes: str | None = None,
    ):
        self.email = email
        self.name = name
        self.company = company
        self.phone = phone
        self.address = address
        self.city = city
        self.state = state
        self.country = country
        self.postal_code = postal_code
        self.notes = notes

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "email": self.email,
            "name": self.name,
            "company": self.company,
            "phone": self.phone,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "country": self.country,
            "postal_code": self.postal_code,
            "notes": self.notes,
        }

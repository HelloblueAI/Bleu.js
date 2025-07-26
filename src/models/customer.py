"""Customer model."""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.orm import relationship

from src.models.base import Base


class Customer(Base):
    """Customer model."""

    __tablename__ = "customers"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
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
    payments = relationship("Payment", back_populates="customer")
    api_calls = relationship("APICall", back_populates="customer")

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

"""API call model."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .declarative_base import Base


class APICall(Base):
    """API call model."""

    __tablename__ = "api_calls"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    customer_id = Column(String, ForeignKey("customers.id"))
    endpoint = Column(String)
    method = Column(String)
    status_code = Column(Integer)
    response_time = Column(Integer)  # in milliseconds
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="api_calls")
    customer = relationship("Customer", back_populates="api_calls")


class APIUsage(Base):
    """API usage model."""

    __tablename__ = "api_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    calls_count = Column(Integer, default=0)
    last_reset = Column(DateTime, default=datetime.utcnow)
    next_reset = Column(DateTime)

    user = relationship("User", back_populates="api_usage")


# Pydantic models for API
class APICallBase(BaseModel):
    endpoint: str
    method: str
    response_time: int
    status_code: int

    model_config = ConfigDict(arbitrary_types_allowed=True)


class APICallCreate(APICallBase):
    customer_id: str

    model_config = ConfigDict(arbitrary_types_allowed=True)


class APICallResponse(APICallBase):
    id: int
    customer_id: str
    created_at: datetime

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)

"""
Core models for the Bleu.js application.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class SubscriptionTier(str, Enum):
    """Subscription tiers for API access."""

    FREE = "free"
    REGULAR = "regular"
    ENTERPRISE = "enterprise"


class Subscription(BaseModel):
    """Subscription model for API access."""

    id: int
    user_id: int
    tier: SubscriptionTier
    api_calls_remaining: int
    created_at: datetime
    updated_at: datetime
    last_reset: datetime


class APICallLog(BaseModel):
    """Log entry for API calls."""

    id: int
    user_id: int
    endpoint: str
    method: str
    status_code: int
    response_time: float
    created_at: datetime


class UsageStats(BaseModel):
    """Statistics for API usage."""

    total_calls: int
    remaining_calls: int
    recent_calls: list[APICallLog]
    tier: SubscriptionTier
    next_reset: datetime


class Job(BaseModel):
    """Job model for processing tasks."""

    id: int
    user_id: int
    job_type: str
    status: str
    created_at: datetime
    updated_at: datetime
    result: Optional[dict] = None
    error: Optional[str] = None


class User(BaseModel):
    """User model."""

    id: int
    username: str
    email: str
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime


class UserCreate(BaseModel):
    """User creation model."""

    username: str
    email: str
    password: str


class UserResponse(BaseModel):
    """User response model."""

    id: int
    username: str
    email: str
    is_active: bool
    is_admin: bool
    created_at: datetime


class Project(BaseModel):
    """Project model."""

    id: int
    name: str
    description: str
    user_id: int
    created_at: datetime
    updated_at: datetime


class ProjectCreate(BaseModel):
    """Project creation model."""

    name: str
    description: str


class ProjectResponse(BaseModel):
    """Project response model."""

    id: int
    name: str
    description: str
    created_at: datetime
    updated_at: datetime


class Model(BaseModel):
    """Model model."""

    id: int
    name: str
    description: str
    model_type: str
    user_id: int
    created_at: datetime
    updated_at: datetime


class ModelCreate(BaseModel):
    """Model creation model."""

    name: str
    description: str
    model_type: str


class ModelResponse(BaseModel):
    """Model response model."""

    id: int
    name: str
    description: str
    model_type: str
    created_at: datetime
    updated_at: datetime


class Dataset(BaseModel):
    """Dataset model."""

    id: int
    name: str
    description: str
    user_id: int
    created_at: datetime
    updated_at: datetime


class DatasetCreate(BaseModel):
    """Dataset creation model."""

    name: str
    description: str


class DatasetResponse(BaseModel):
    """Dataset response model."""

    id: int
    name: str
    description: str
    created_at: datetime
    updated_at: datetime


class JobList(BaseModel):
    """Job list response model."""

    jobs: list[Job]
    total: int
    page: int
    limit: int


class JobResponse(BaseModel):
    """Job response model."""

    id: int
    user_id: int
    job_type: str
    status: str
    created_at: datetime
    updated_at: datetime
    result: Optional[dict] = None
    error: Optional[str] = None


class JobUpdate(BaseModel):
    """Job update model."""

    status: str
    result: Optional[dict] = None
    error: Optional[str] = None

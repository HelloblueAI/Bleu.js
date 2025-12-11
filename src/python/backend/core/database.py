"""
Database setup and models for the Bleu.js application.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import DeclarativeMeta, relationship, sessionmaker

from .models import SubscriptionTier

Base: DeclarativeMeta = declarative_base()


class User(Base):
    """User model."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    uuid = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    api_calls = relationship("APICallLog", back_populates="user")
    jobs = relationship("Job", back_populates="user")
    projects = relationship(
        "Project", back_populates="user", cascade="all, delete-orphan"
    )
    models = relationship("Model", back_populates="user", cascade="all, delete-orphan")
    datasets = relationship(
        "Dataset", back_populates="user", cascade="all, delete-orphan"
    )


class Subscription(Base):
    """Subscription model."""

    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tier = Column(Enum(SubscriptionTier), nullable=False, default=SubscriptionTier.FREE)
    api_calls_remaining = Column(Integer, nullable=False)
    api_calls_total = Column(Integer, nullable=False)
    last_reset = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="subscription")


class APICallLog(Base):
    """API call log model."""

    __tablename__ = "api_call_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    endpoint = Column(String(100), nullable=False)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="api_calls")


class Job(Base):
    """Job model."""

    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_type = Column(String(50), nullable=False)
    status = Column(String(20), default="pending")
    progress = Column(Float, default=0.0)
    result = Column(JSON)
    error = Column(Text)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="jobs")


class Project(Base):
    """Project model."""

    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="projects")
    models = relationship(
        "Model", back_populates="project", cascade="all, delete-orphan"
    )
    datasets = relationship(
        "Dataset", back_populates="project", cascade="all, delete-orphan"
    )


class Model(Base):
    """Model model."""

    __tablename__ = "models"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    model_type = Column(String(50), nullable=False)
    architecture = Column(Text, nullable=True)
    hyperparameters = Column(JSON, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="models")
    user = relationship("User", back_populates="models")


class Dataset(Base):
    """Dataset model."""

    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    data_type = Column(String(50), nullable=False)
    data_path = Column(String(500), nullable=True)
    metadata = Column(JSON, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="datasets")
    user = relationship("User", back_populates="datasets")


# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./bleujs.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class DatabaseManager:
    """Database manager for handling database operations."""

    def __init__(self):
        self.engine = engine
        self.SessionLocal = SessionLocal

    def get_session(self):
        """Get a new database session."""
        return self.SessionLocal()

    def create_tables(self):
        """Create all database tables."""
        Base.metadata.create_all(bind=self.engine)

    def drop_tables(self):
        """Drop all database tables."""
        Base.metadata.drop_all(bind=self.engine)


# Create global database manager instance
db_manager = DatabaseManager()

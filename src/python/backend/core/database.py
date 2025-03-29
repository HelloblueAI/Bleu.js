"""
Database connection manager for the backend.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
import logging
from typing import Generator
from ..config.settings import settings

class DatabaseManager:
    """Database connection manager."""
    
    def __init__(self):
        self.config = settings.get_config().database
        self.logger = logging.getLogger(__name__)
        self._engine = None
        self._SessionLocal = None
        
    def _create_engine(self):
        """Create SQLAlchemy engine with connection pooling."""
        if self._engine is None:
            connection_url = (
                f"postgresql://{self.config.username}:{self.config.password}"
                f"@{self.config.host}:{self.config.port}/{self.config.database}"
            )
            
            self._engine = create_engine(
                connection_url,
                poolclass=QueuePool,
                pool_size=self.config.pool_size,
                max_overflow=self.config.max_overflow,
                pool_timeout=self.config.pool_timeout,
                pool_recycle=self.config.pool_recycle,
                echo=settings.get_config().debug
            )
            
    def _create_session_factory(self):
        """Create session factory."""
        if self._SessionLocal is None:
            self._SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self._engine
            )
            
    def initialize(self):
        """Initialize database connection."""
        try:
            self._create_engine()
            self._create_session_factory()
            self.logger.info("Database connection initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize database connection: {e}")
            raise
            
    @contextmanager
    def get_session(self) -> Generator[Session, None, None]:
        """Get database session with automatic cleanup."""
        if self._SessionLocal is None:
            self.initialize()
            if self._SessionLocal is None:
                raise RuntimeError("Failed to initialize database session")
            
        session = self._SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            self.logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()
            
    def check_connection(self) -> bool:
        """Check if database connection is working."""
        try:
            with self.get_session() as session:
                session.execute("SELECT 1")
            return True
        except Exception as e:
            self.logger.error(f"Database connection check failed: {e}")
            return False
            
    def close(self):
        """Close database connection."""
        if self._engine:
            self._engine.dispose()
            self._engine = None
            self._SessionLocal = None
            self.logger.info("Database connection closed")

# Create global database manager instance
db_manager = DatabaseManager() 
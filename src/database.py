import logging
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.models.declarative_base import Base

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_database_url() -> str:
    """Get database URL with proper fallback logic."""
    try:
        # First try environment variable
        if os.getenv("DATABASE_URL"):
            return os.getenv("DATABASE_URL")

        # Fallback to individual components
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME", "bleujs_dev")
        db_user = os.getenv("DB_USER", "bleujs_dev")
        db_password = os.getenv("DB_PASSWORD", "")

        if db_password:
            return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        else:
            return f"postgresql://{db_user}@{db_host}:{db_port}/{db_name}"

    except Exception as e:
        logger.warning(f"Failed to construct database URL: {e}")
        # Final fallback to SQLite
        return "sqlite:///./bleujs.db"


# Create engine with appropriate configuration
if os.getenv("TESTING") == "true":
    from tests.test_config import get_test_settings

    settings = get_test_settings()
    if settings.DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    else:
        engine = create_engine(settings.DATABASE_URL)
else:
    # Production/development database
    database_url = get_database_url()

    if database_url.startswith("sqlite"):
        engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    else:
        # PostgreSQL with connection pooling
        engine = create_engine(
            database_url,
            pool_size=int(os.getenv("DATABASE_POOL_SIZE", "5")),
            max_overflow=int(os.getenv("DATABASE_MAX_OVERFLOW", "10")),
            pool_pre_ping=True,
            pool_recycle=3600,
        )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    FastAPI dependency for database sessions.
    Ensures the session is properly closed after use and handles rollback on errors.
    """
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error in database session: {str(e)}")
        raise
    finally:
        db.close()


def init_db():
    """Initialize the database, creating all tables."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    except SQLAlchemyError as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during database initialization: {str(e)}")
        raise


def check_db_connection():
    """Check if database connection is working."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection successful")
        return True
    except SQLAlchemyError as e:
        logger.error(f"Database connection failed: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error checking database connection: {str(e)}")
        return False


def get_db_stats() -> dict:
    """Get database statistics and health metrics."""
    try:
        with engine.connect() as conn:
            # Get basic connection info
            result = conn.execute(text("SELECT version()"))
            version = result.scalar()

            # Get connection count
            result = conn.execute(text("SELECT count(*) FROM pg_stat_activity"))
            active_connections = result.scalar()

            return {
                "status": "healthy",
                "version": version,
                "active_connections": active_connections,
                "pool_size": engine.pool.size(),
                "checked_in": engine.pool.checkedin(),
                "checked_out": engine.pool.checkedout(),
            }
    except Exception as e:
        logger.error(f"Failed to get database stats: {str(e)}")
        return {"status": "error", "error": str(e)}

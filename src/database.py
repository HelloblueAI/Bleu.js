import logging
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.models.declarative_base import Base

# Load environment variables (but don't override existing env vars)
load_dotenv(override=False)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_database_url() -> str:
    """Get database URL with proper fallback logic."""
    try:
        # First try environment variable (highest priority)
        env_db_url = os.getenv("DATABASE_URL")
        if env_db_url:
            logger.info(f"Using DATABASE_URL from environment: {env_db_url[:50]}...")
            return env_db_url

        # Try to get from Settings if available (but only if no env var)
        try:
            from src.config import get_settings

            settings = get_settings()
            if hasattr(settings, "DATABASE_URL") and settings.DATABASE_URL:
                logger.info(
                    f"Using DATABASE_URL from settings: {settings.DATABASE_URL[:50]}..."
                )
                return settings.DATABASE_URL
        except Exception:
            pass  # Settings might not be available yet

        # Fallback to individual components
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME", "bleujs_dev")
        db_user = os.getenv("DB_USER", "bleujs_dev")
        db_password = os.getenv("DB_PASSWORD", "")

        # If no password, default to SQLite instead of PostgreSQL
        if not db_password:
            logger.info("No DB_PASSWORD found, defaulting to SQLite")
            return "sqlite:///./bleujs.db"

        return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

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
            db_url_str = str(engine.url)
            is_sqlite = db_url_str.startswith("sqlite")

            # Get basic connection info
            if is_sqlite:
                version = "SQLite"
                # SQLite doesn't have pg_stat_activity, use a simple query instead
                result = conn.execute(text("SELECT 1"))
                active_connections = (
                    1  # SQLite doesn't track connection counts the same way
                )
            else:
                # PostgreSQL-specific queries
                result = conn.execute(text("SELECT version()"))
                version = result.scalar()
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

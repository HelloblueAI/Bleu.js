"""
Main entry point for the Bleu.js application.
"""

import logging
import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI

from src.python.backend.config.settings import settings
from src.python.backend.core.cache import cache_manager
from src.python.backend.core.database import db_manager
from src.python.backend.core.job_queue import job_queue_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def startup_event():
    """Initialize application components."""
    try:
        # Initialize database - create tables if needed
        db_manager.create_tables()

        # Initialize job queue
        await job_queue_manager.initialize()

        # Initialize cache
        if hasattr(cache_manager, "initialize"):
            await cache_manager.initialize()

        logger.info("Application components initialized successfully")
    except Exception as e:
        logger.error("Failed to initialize application components", error=str(e))
        raise


async def shutdown_event():
    """Cleanup application components."""
    try:
        # Cleanup job queue
        await job_queue_manager.shutdown()

        # Cleanup cache
        if hasattr(cache_manager, "cleanup"):
            await cache_manager.cleanup()
        if hasattr(cache_manager, "close"):
            await cache_manager.close()

        logger.info("Application components cleaned up successfully")
    except Exception as e:
        logger.error("Failed to cleanup application components", error=str(e))
        raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    # Startup
    await startup_event()
    yield
    # Shutdown
    await shutdown_event()


def main():
    """Main application entry point."""
    try:
        config = settings.get_config()

        # Allow environment variable to override port
        port = int(os.getenv("API_PORT", config.api.port))
        host = os.getenv("API_HOST", config.api.host)

        # Create FastAPI app
        app = FastAPI(
            title="Bleu.js API",
            description=(
                "A state-of-the-art quantum-enhanced vision system "
                "with advanced AI capabilities"
            ),
            version="1.2.3",
            lifespan=lifespan,
        )

        # Include router
        from src.python.backend.api.router import router

        app.include_router(router)

        # Run uvicorn server
        # For production with workers, use: uvicorn main:app --workers 4
        uvicorn.run(
            app,
            host=host,
            port=port,
            reload=config.api.debug,
            log_level=config.api.log_level.lower(),
        )
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise


if __name__ == "__main__":
    main()

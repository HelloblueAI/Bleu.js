"""
Main entry point for the Bleu.js application.
"""

import structlog
import uvicorn
from src.python.config.settings import settings
from src.python.core.cache import cache_manager
from src.python.core.database import db_manager
from src.python.core.job_queue import job_queue_manager


# Configure logging
logger = structlog.get_logger()


async def startup_event():
    """Initialize application components."""
    try:
        # Initialize database
        await db_manager.initialize()

        # Initialize job queue
        await job_queue_manager.initialize()

        # Initialize cache
        await cache_manager.initialize()

        logger.info("Application components initialized successfully")
    except Exception as e:
        logger.error("Failed to initialize application components", error=str(e))
        raise


async def shutdown_event():
    """Cleanup application components."""
    try:
        # Cleanup database
        await db_manager.cleanup()

        # Cleanup job queue
        await job_queue_manager.cleanup()

        # Cleanup cache
        await cache_manager.cleanup()

        logger.info("Application components cleaned up successfully")
    except Exception as e:
        logger.error("Failed to cleanup application components", error=str(e))
        raise


def main():
    """Main application entry point."""
    config = settings.get_config()

    uvicorn.run(
        "src.python.backend.api.router:router",
        host=config.api.host,
        port=config.api.port,
        reload=config.api.debug,
        workers=config.api.workers,
        log_level=config.api.log_level,
        on_startup=[startup_event],
        on_shutdown=[shutdown_event],
    )


if __name__ == "__main__":
    main()

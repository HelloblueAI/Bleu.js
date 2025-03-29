"""
Main application file for the backend.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import logging.handlers
from pathlib import Path
import asyncio

from .config.settings import settings
from .api.router import router
from .core.database import db_manager
from .core.cache import cache_manager
from .core.job_queue import job_queue_manager

# Configure logging
def setup_logging():
    """Setup logging configuration."""
    log_config = settings.get_config().logging
    logger = logging.getLogger()
    logger.setLevel(log_config.level)
    
    # Create formatter
    formatter = logging.Formatter(log_config.format)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler if configured
    if log_config.file:
        log_path = Path(log_config.file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.handlers.RotatingFileHandler(
            log_config.file,
            maxBytes=log_config.max_size,
            backupCount=log_config.backup_count
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

# Create FastAPI app
app = FastAPI(
    title="Quantum ML Backend",
    description="Backend API for Quantum Machine Learning Platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_config().api.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    # Setup logging
    setup_logging()
    logger = logging.getLogger(__name__)
    logger.info("Starting application...")
    
    try:
        # Initialize database
        await db_manager.initialize()
        logger.info("Database initialized")
        
        # Initialize cache
        await cache_manager.initialize()
        logger.info("Cache initialized")
        
        # Initialize job queue
        await job_queue_manager.initialize()
        logger.info("Job queue initialized")
        
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger = logging.getLogger(__name__)
    logger.info("Shutting down application...")
    
    try:
        # Close database connection
        db_manager.close()
        logger.info("Database connection closed")
        
        # Close cache connection
        await cache_manager.close()
        logger.info("Cache connection closed")
        
        # Shutdown job queue
        if job_queue_manager:
            await job_queue_manager.shutdown()
            logger.info("Job queue shut down")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Check database connection
        db_healthy = db_manager.check_connection()
        
        # Check cache connection
        cache_healthy = cache_manager.check_connection()
        
        return {
            "status": "healthy" if db_healthy and cache_healthy else "unhealthy",
            "database": "healthy" if db_healthy else "unhealthy",
            "cache": "healthy" if cache_healthy else "unhealthy"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

def run():
    """Run the application."""
    config = settings.get_config().api
    uvicorn.run(
        "backend.main:app",
        host=config.host,
        port=config.port,
        reload=config.debug,
        workers=config.workers
    )

if __name__ == "__main__":
    run() 
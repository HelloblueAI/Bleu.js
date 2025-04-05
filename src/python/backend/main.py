"""
Main FastAPI application for the Bleu.js backend.
"""

import logging
import logging.handlers
import os
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.router import router
from .config.settings import get_config
from .core.database import Base, engine, get_db


# Configure logging
def setup_logging():
    """Setup logging configuration."""
    config = get_config()
    logger = logging.getLogger()
    logger.setLevel(config.logging.level)

    # Create formatter
    formatter = logging.Formatter(config.logging.format)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler if configured
    if config.logging.file:
        log_path = Path(config.logging.file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.handlers.RotatingFileHandler(
            config.logging.file,
            maxBytes=config.logging.max_size,
            backupCount=config.logging.backup_count,
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)


# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Bleu.js API",
    description="API for the Bleu.js machine learning platform",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    # Setup logging
    setup_logging()
    logger = logging.getLogger(__name__)
    logger.info("Starting application...")

    try:
        # Test database connection
        db = next(get_db())
        db.execute("SELECT 1")
        logger.info("Database connection successful")

    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger = logging.getLogger(__name__)
    logger.info("Shutting down application...")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Check database connection
        db = next(get_db())
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Bleu.js API",
        "version": "1.0.0",
        "docs_url": "https://api.bleujs.com/docs",
    }


def run_server():
    """Run the API server with configuration from environment variables."""
    uvicorn.run(
        "bleujs.main:app",
        host=os.getenv("API_HOST", "127.0.0.1"),  # Default to localhost for security
        port=int(os.getenv("API_PORT", "8000")),
        reload=os.getenv("API_RELOAD", "false").lower() == "true",
    )


if __name__ == "__main__":
    run_server()

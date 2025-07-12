import logging
import os

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from src.config import get_settings
from src.database import init_db
from src.quantum_py.core.quantum_processor import ProcessorConfig, QuantumProcessor
from src.routes import api_tokens, auth, subscription
from tests.test_config import get_test_settings

# Constants
API_V1_PREFIX = "/api/v1"
RENDER_ERROR_MSG = "Error rendering page"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Quantum configuration
QUANTUM_CONFIG = ProcessorConfig(
    num_qubits=5,
    error_rate=0.001,
    decoherence_time=1000.0,
    gate_time=0.1,
    num_workers=4,
    max_depth=1000,
    optimization_level=1,
    use_error_correction=True,
    noise_model="depolarizing",
)

app = FastAPI(
    title="Bleu.js API",
    description=(
        "A state-of-the-art quantum-enhanced vision system "
        "with advanced AI capabilities"
    ),
    version="1.1.4",
)

# Get settings based on environment
settings = get_test_settings() if os.getenv("TESTING") == "true" else get_settings()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Error handling middleware
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred"},
        )


# Mount static files
app.mount("/static", StaticFiles(directory="src/static"), name="static")

# Templates
templates = Jinja2Templates(directory="src/templates")

# Initialize database
if not os.getenv("TESTING"):
    try:
        init_db()
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database initialization failed")

# Include routers
app.include_router(auth.router, prefix=API_V1_PREFIX, tags=["auth"])
app.include_router(subscription.router, prefix=API_V1_PREFIX, tags=["subscription"])
app.include_router(api_tokens.router, prefix=API_V1_PREFIX, tags=["api_tokens"])


# Serve HTML pages
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    try:
        return templates.TemplateResponse("index.html", {"request": request})
    except Exception as e:
        logger.error(f"Error rendering home page: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=RENDER_ERROR_MSG)


@app.get("/signup", response_class=HTMLResponse)
async def signup_page(request: Request):
    try:
        return templates.TemplateResponse("signup.html", {"request": request})
    except Exception as e:
        logger.error(f"Error rendering signup page: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=RENDER_ERROR_MSG)


@app.get("/signin", response_class=HTMLResponse)
async def signin_page(request: Request):
    try:
        return templates.TemplateResponse("signin.html", {"request": request})
    except Exception as e:
        logger.error(f"Error rendering signin page: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=RENDER_ERROR_MSG)


@app.get("/forgot-password", response_class=HTMLResponse)
async def forgot_password_page(request: Request):
    try:
        return templates.TemplateResponse("forgot_password.html", {"request": request})
    except Exception as e:
        logger.error(f"Error rendering forgot password page: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=RENDER_ERROR_MSG)


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    try:
        return templates.TemplateResponse("dashboard.html", {"request": request})
    except Exception as e:
        logger.error(f"Error rendering dashboard page: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=RENDER_ERROR_MSG)


@app.get("/subscription", response_class=HTMLResponse)
async def subscription_dashboard(request: Request):
    try:
        return templates.TemplateResponse(
            "subscription_dashboard.html", {"request": request}
        )
    except Exception as e:
        logger.error(f"Error rendering subscription dashboard: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=RENDER_ERROR_MSG)


@app.get("/")
async def root():
    return {
        "message": "Welcome to Bleu.js API",
        "version": "1.1.4",
        "documentation": "/docs",
    }


def initialize_quantum_system():
    """Initialize the quantum computing system with necessary configurations and validations."""
    quantum_processor = QuantumProcessor(config=QUANTUM_CONFIG)
    return quantum_processor


if __name__ == "__main__":
    host = os.getenv("API_HOST", "127.0.0.1")  # Default to localhost
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)

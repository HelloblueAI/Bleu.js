import os
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from src.routes import auth, subscription, api_tokens
from src.database import init_db
from src.config import get_settings
from tests.test_config import get_test_settings

# Constants
API_V1_PREFIX = "/api/v1"

app = FastAPI(
    title="Bleu.js API",
    description="A state-of-the-art quantum-enhanced vision system with advanced AI capabilities",
    version="1.1.3",
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

# Mount static files
app.mount("/static", StaticFiles(directory="src/static"), name="static")

# Templates
templates = Jinja2Templates(directory="src/templates")

# Initialize database
if not os.getenv("TESTING"):
    init_db()

# Include routers
app.include_router(auth.router, prefix=API_V1_PREFIX, tags=["auth"])
app.include_router(subscription.router, prefix=API_V1_PREFIX, tags=["subscription"])
app.include_router(api_tokens.router, prefix=API_V1_PREFIX, tags=["api_tokens"])

# Serve HTML pages
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/signup", response_class=HTMLResponse)
async def signup_page(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

@app.get("/signin", response_class=HTMLResponse)
async def signin_page(request: Request):
    return templates.TemplateResponse("signin.html", {"request": request})

@app.get("/forgot-password", response_class=HTMLResponse)
async def forgot_password_page(request: Request):
    return templates.TemplateResponse("forgot_password.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

@app.get("/subscription", response_class=HTMLResponse)
async def subscription_dashboard(request: Request):
    return templates.TemplateResponse(
        "subscription_dashboard.html", {"request": request}
    )

@app.get("/")
async def root():
    return {
        "message": "Welcome to Bleu.js API",
        "version": "1.1.3",
        "documentation": "/docs",
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

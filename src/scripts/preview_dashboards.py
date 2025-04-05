import os

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="src/static"), name="static")

# Templates
templates = Jinja2Templates(directory="src/templates")

# Example data for COR-E user
CORE_DATA = {
    "api_calls_remaining": 75,
    "api_calls_limit": 100,
    "rate_limit": 10,
    "current_period_end": "2024-04-30T23:59:59Z",
    "plan_type": "CORE",
    "features": {
        "core_ai_model_access": True,
        "basic_analytics": True,
        "email_support": True,
        "api_documentation": True,
        "standard_response_time": True,
    },
}

# Example data for Enterprise user
ENTERPRISE_DATA = {
    "api_calls_remaining": 4500,
    "api_calls_limit": 5000,
    "rate_limit": 100,
    "current_period_end": "2024-04-30T23:59:59Z",
    "plan_type": "ENTERPRISE",
    "features": {
        "core_ai_model_access": True,
        "advanced_analytics": True,
        "priority_support": True,
        "dedicated_account_manager": True,
        "custom_model_training": True,
        "custom_integrations": True,
        "sla_guarantees": True,
        "advanced_documentation": True,
    },
}


@app.get("/core", response_class=HTMLResponse)
async def core_dashboard(request: Request):
    return templates.TemplateResponse(
        "dashboard.html", {"request": request, "usage_data": CORE_DATA}
    )


@app.get("/enterprise", response_class=HTMLResponse)
async def enterprise_dashboard(request: Request):
    return templates.TemplateResponse(
        "dashboard.html", {"request": request, "usage_data": ENTERPRISE_DATA}
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

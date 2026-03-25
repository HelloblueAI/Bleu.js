"""
Product app tests: assert the bleujs.org app (src.main.app) exposes the expected surface.
"""

import os

import pytest

# Ensure test config is used
os.environ["TESTING"] = "true"


@pytest.fixture
def app():
    """Load the product FastAPI app (src.main.app)."""
    from src.main import app as _app

    return _app


def _openapi_paths(app):
    """Return set of API paths from OpenAPI schema (reliable for mounted routers)."""
    schema = app.openapi()
    return set(schema.get("paths", {}).keys())


def test_product_app_has_api_v1_auth_routes(app):
    """Product app must expose auth under /api/v1 (register, token, me)."""
    paths = _openapi_paths(app)
    auth_paths = ["/api/v1/register", "/api/v1/token", "/api/v1/me"]
    assert any(
        p in paths for p in auth_paths
    ), "Product app should expose /api/v1 auth routes (register, token, me)"


def test_product_app_has_api_v1_subscription_routes(app):
    """Product app must expose subscription under /api/v1 (plans, current)."""
    paths = _openapi_paths(app)
    sub_paths = ["/api/v1/subscriptions/plans", "/api/v1/subscriptions/current"]
    assert any(
        p in paths for p in sub_paths
    ), "Product app should expose /api/v1 subscription routes (plans, current)"


def test_product_app_has_health(app):
    """Product app must expose /health for probes."""
    paths = _openapi_paths(app)
    assert "/health" in paths, "Product app should expose /health"


def test_product_app_has_gateway_predict(app):
    """Product app must expose POST /predict for bleujs.org BLEUJS_API_URL gateway."""
    paths = _openapi_paths(app)
    assert "/predict" in paths, "Product app should expose POST /predict"


def test_product_app_title_is_bleujs(app):
    """Product app title identifies Bleu.js."""
    title = getattr(app, "title", "") or ""
    assert "Bleu" in title or "bleu" in title.lower()

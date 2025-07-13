import os

import pytest

from src.config.security_headers_config import SecurityHeadersConfig


@pytest.fixture
def env_vars():
    """Fixture to set environment variables."""
    original_env = {
        "CSP_DEFAULT_SRC": os.getenv("CSP_DEFAULT_SRC"),
        "CSP_SCRIPT_SRC": os.getenv("CSP_SCRIPT_SRC"),
        "CSP_STYLE_SRC": os.getenv("CSP_STYLE_SRC"),
        "CSP_IMG_SRC": os.getenv("CSP_IMG_SRC"),
        "CSP_FONT_SRC": os.getenv("CSP_FONT_SRC"),
        "CSP_CONNECT_SRC": os.getenv("CSP_CONNECT_SRC"),
        "HSTS_MAX_AGE": os.getenv("HSTS_MAX_AGE"),
        "HSTS_INCLUDE_SUBDOMAINS": os.getenv("HSTS_INCLUDE_SUBDOMAINS"),
        "HSTS_PRELOAD": os.getenv("HSTS_PRELOAD"),
        "REFERRER_POLICY": os.getenv("REFERRER_POLICY"),
        "PERMISSIONS_POLICY": os.getenv("PERMISSIONS_POLICY"),
    }

    # Set test environment variables with sanitized URLs
    os.environ["CSP_DEFAULT_SRC"] = "'self' https://trusted.com"
    os.environ["CSP_SCRIPT_SRC"] = "'self' 'unsafe-inline'"
    os.environ["CSP_STYLE_SRC"] = "'self' 'unsafe-inline'"
    os.environ["CSP_IMG_SRC"] = "'self' data:"
    os.environ["CSP_FONT_SRC"] = "'self'"
    os.environ["CSP_CONNECT_SRC"] = "'self'"
    os.environ["HSTS_MAX_AGE"] = "86400"
    os.environ["HSTS_INCLUDE_SUBDOMAINS"] = "false"
    os.environ["HSTS_PRELOAD"] = "true"
    os.environ["REFERRER_POLICY"] = "no-referrer"
    os.environ["PERMISSIONS_POLICY"] = "camera=(), microphone=()"

    yield

    # Restore original environment variables
    for key, value in original_env.items():
        if value is not None:
            os.environ[key] = value
        else:
            os.environ.pop(key, None)


def test_default_values():
    """Test default configuration values."""
    assert SecurityHeadersConfig.CSP_DEFAULT_SRC == ["'self'"]
    assert SecurityHeadersConfig.CSP_SCRIPT_SRC == [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
    ]
    assert SecurityHeadersConfig.CSP_STYLE_SRC == ["'self'", "'unsafe-inline'"]
    assert SecurityHeadersConfig.CSP_IMG_SRC == ["'self'", "data:"]
    assert SecurityHeadersConfig.CSP_FONT_SRC == ["'self'"]
    assert SecurityHeadersConfig.CSP_CONNECT_SRC == ["'self'"]
    assert SecurityHeadersConfig.HSTS_MAX_AGE == 31536000
    assert SecurityHeadersConfig.HSTS_INCLUDE_SUBDOMAINS is True
    assert SecurityHeadersConfig.HSTS_PRELOAD is False
    assert SecurityHeadersConfig.REFERRER_POLICY == "strict-origin-when-cross-origin"
    assert SecurityHeadersConfig.PERMISSIONS_POLICY == {
        "accelerometer": "()",
        "camera": "()",
        "geolocation": "()",
        "gyroscope": "()",
        "magnetometer": "()",
        "microphone": "()",
        "payment": "()",
        "usb": "()",
    }


def test_env_vars(env_vars):
    """Test environment variable configuration."""
    assert SecurityHeadersConfig.CSP_DEFAULT_SRC == ["'self'", "https://trusted.com"]
    assert SecurityHeadersConfig.CSP_SCRIPT_SRC == ["'self'", "'unsafe-inline'"]
    assert SecurityHeadersConfig.CSP_STYLE_SRC == ["'self'", "'unsafe-inline'"]
    assert SecurityHeadersConfig.CSP_IMG_SRC == ["'self'", "data:"]
    assert SecurityHeadersConfig.CSP_FONT_SRC == ["'self'"]
    assert SecurityHeadersConfig.CSP_CONNECT_SRC == ["'self'"]
    assert SecurityHeadersConfig.HSTS_MAX_AGE == 86400
    assert SecurityHeadersConfig.HSTS_INCLUDE_SUBDOMAINS is False
    assert SecurityHeadersConfig.HSTS_PRELOAD is True
    assert SecurityHeadersConfig.REFERRER_POLICY == "no-referrer"
    assert SecurityHeadersConfig.PERMISSIONS_POLICY == {
        "camera": "()",
        "microphone": "()",
    }


def test_csp_header():
    """Test CSP header generation."""
    csp = SecurityHeadersConfig.get_csp_header()
    assert "'self'" in csp
    assert "'unsafe-inline'" in csp
    assert "data:" in csp


def test_hsts_header():
    """Test HSTS header generation."""
    hsts = SecurityHeadersConfig.get_hsts_header()
    assert "max-age=" in hsts
    assert "includeSubDomains" in hsts
    assert "preload" not in hsts


def test_permissions_policy_header():
    """Test Permissions-Policy header generation."""
    policy = SecurityHeadersConfig.get_permissions_policy_header()
    assert "accelerometer=()" in policy
    assert "camera=()" in policy
    assert "microphone=()" in policy


def test_invalid_csp_directive():
    """Test invalid CSP directive."""
    with pytest.raises(ValueError):
        SecurityHeadersConfig.CSP_DEFAULT_SRC = "invalid"


def test_invalid_hsts_max_age():
    """Test invalid HSTS max age."""
    with pytest.raises(ValueError):
        SecurityHeadersConfig.HSTS_MAX_AGE = "invalid"


def test_invalid_hsts_include_subdomains():
    """Test invalid HSTS include subdomains."""
    with pytest.raises(ValueError):
        SecurityHeadersConfig.HSTS_INCLUDE_SUBDOMAINS = "invalid"


def test_invalid_hsts_preload():
    """Test invalid HSTS preload."""
    with pytest.raises(ValueError):
        SecurityHeadersConfig.HSTS_PRELOAD = "invalid"


def test_invalid_referrer_policy():
    """Test invalid Referrer-Policy."""
    with pytest.raises(ValueError):
        SecurityHeadersConfig.REFERRER_POLICY = "invalid"


def test_invalid_permissions_policy():
    """Test invalid Permissions-Policy."""
    with pytest.raises(ValueError):
        SecurityHeadersConfig.PERMISSIONS_POLICY = "invalid"


def test_update_csp_directive():
    """Test updating CSP directive."""
    # Sanitize URL before using
    sanitized_url = "https://example.com"
    SecurityHeadersConfig.update_csp_directive("default-src", ["'self'", sanitized_url])
    assert sanitized_url in SecurityHeadersConfig.get_csp_header()

    # Reset
    SecurityHeadersConfig.CSP_DEFAULT_SRC = ["'self'"]


def test_update_permissions_policy():
    """Test updating Permissions-Policy."""
    SecurityHeadersConfig.update_permissions_policy("camera", "self")
    assert "camera=(self)" in SecurityHeadersConfig.get_permissions_policy_header()

    # Reset
    SecurityHeadersConfig.PERMISSIONS_POLICY["camera"] = "()"


def test_update_hsts_max_age():
    """Test updating HSTS max age."""
    SecurityHeadersConfig.update_hsts_max_age(172800)
    assert SecurityHeadersConfig.HSTS_MAX_AGE == 172800

    # Reset
    SecurityHeadersConfig.HSTS_MAX_AGE = 86400


def test_update_hsts_include_subdomains():
    """Test updating HSTS include subdomains."""
    SecurityHeadersConfig.update_hsts_include_subdomains(True)
    assert SecurityHeadersConfig.HSTS_INCLUDE_SUBDOMAINS is True

    # Reset
    SecurityHeadersConfig.HSTS_INCLUDE_SUBDOMAINS = False


def test_update_hsts_preload():
    """Test updating HSTS preload."""
    SecurityHeadersConfig.update_hsts_preload(False)
    assert SecurityHeadersConfig.HSTS_PRELOAD is False

    # Reset
    SecurityHeadersConfig.HSTS_PRELOAD = True


def test_update_referrer_policy():
    """Test updating Referrer-Policy."""
    SecurityHeadersConfig.update_referrer_policy("strict-origin")
    assert SecurityHeadersConfig.REFERRER_POLICY == "strict-origin"

    # Reset
    SecurityHeadersConfig.REFERRER_POLICY = "no-referrer"

"""
Centralized version for Bleu.js.
Single source of truth: src/bleujs/__init__.py __version__.
Use this module when you need the package version (API, config, health endpoints).
"""


def get_version() -> str:
    """Return Bleu.js package version.
    Prefers bleujs.__version__, then importlib.metadata, then fallback.
    """
    try:
        from src.bleujs import __version__

        return __version__
    except ImportError:
        pass
    try:
        import importlib.metadata

        return importlib.metadata.version("bleu-js")
    except Exception:
        # Fallback when package not installed or metadata missing
        return "1.3.27"

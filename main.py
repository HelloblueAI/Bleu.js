#!/usr/bin/env python3
"""
Single entry point for the Bleu.js product app (bleujs.org).

  Run the product app (dashboard + API):   python main.py
  Or with uvicorn:                        python -m uvicorn src.main:app --reload

For the legacy ML/internal backend (src.python.backend), set:
  BLEUJS_LEGACY_BACKEND=1 python main.py

See docs/PRODUCT_ARCHITECTURE.md.
"""

import os
import sys


def _run_product_app() -> None:
    """Run the canonical Bleu.js product app (src.main:app)."""
    import uvicorn

    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "8000"))
    reload = os.getenv("BLEUJS_RELOAD", "").lower() in ("1", "true", "yes")
    uvicorn.run(
        "src.main:app",
        host=host,
        port=port,
        reload=reload,
    )


def _run_legacy_backend() -> None:
    """Run the legacy ML/internal backend (src.python.backend.main:app)."""
    import uvicorn

    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "8000"))
    try:
        uvicorn.run(
            "src.python.backend.main:app",
            host=host,
            port=port,
            reload=os.getenv("BLEUJS_RELOAD", "").lower() in ("1", "true", "yes"),
        )
    except ImportError as e:
        print(
            f"BLEUJS_LEGACY_BACKEND=1 but backend not available: {e}",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    if os.getenv("BLEUJS_LEGACY_BACKEND", "").strip() == "1":
        _run_legacy_backend()
    else:
        _run_product_app()

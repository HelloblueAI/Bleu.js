#!/usr/bin/env python3
"""Contract check: openapi.yaml paths section defines routes the edge stub implements."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("contract: install PyYAML (pip install pyyaml)", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[3]
SPEC_PATH = ROOT / "docs" / "api" / "openapi.yaml"

REQUIRED_PATHS = ["/api/v1/chat", "/api/v1/generate", "/api/v1/embed", "/api/v1/models"]
RECOMMENDED_PATHS = ["/health"]


def main() -> int:
    try:
        spec = yaml.safe_load(SPEC_PATH.read_text(encoding="utf-8"))
    except OSError as exc:
        print(f"contract: could not read spec at {SPEC_PATH}: {exc}", file=sys.stderr)
        return 1

    paths = set((spec or {}).get("paths") or {})
    missing_required = [p for p in REQUIRED_PATHS if p not in paths]
    if missing_required:
        print(
            "contract: spec paths section is missing required paths:",
            ", ".join(missing_required),
            file=sys.stderr,
        )
        return 1

    missing_recommended = [p for p in RECOMMENDED_PATHS if p not in paths]
    if missing_recommended:
        print(
            "contract: spec should also define (recommended):",
            ", ".join(missing_recommended),
        )

    print("contract: spec contains required paths")
    return 0


if __name__ == "__main__":
    sys.exit(main())

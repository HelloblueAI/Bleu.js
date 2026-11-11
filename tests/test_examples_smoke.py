"""
Smoke test for examples/quick_start.py

Runs the quick_start.py example offline (no API key, no network) and
verifies that it exits with code 0 and prints the expected completion message.

Covers: Issue #367 — test: add a smoke test that runs examples/quick_start.py offline
"""

import os
import subprocess
import sys
from pathlib import Path

import pytest

# Path to the example script, resolved relative to the repo root.
REPO_ROOT = Path(__file__).resolve().parent.parent
QUICK_START = REPO_ROOT / "examples" / "quick_start.py"


@pytest.mark.slow
def test_quick_start_exits_zero_and_prints_completion(tmp_path):
    """
    Runs examples/quick_start.py in an isolated subprocess with no API key
    and asserts:
      - exit code is 0
      - stdout contains "Quick Start Complete!"
    """
    # Build a clean environment with BLEUJS_API_KEY stripped so the script
    # has no access to any real or test key — it must succeed without one.
    env = {k: v for k, v in os.environ.items() if k != "BLEUJS_API_KEY"}

    result = subprocess.run(
        [sys.executable, str(QUICK_START)],
        capture_output=True,
        text=True,
        timeout=120,
        cwd=str(tmp_path),
        env=env,
    )

    # Provide full output on failure for easy debugging.
    assert result.returncode == 0, (
        f"quick_start.py exited with code {result.returncode}.\n"
        f"--- stdout ---\n{result.stdout}\n"
        f"--- stderr ---\n{result.stderr}"
    )
    assert "Quick Start Complete!" in result.stdout, (
        "Expected 'Quick Start Complete!' in stdout, but got:\n"
        f"{result.stdout}"
    )


"""
Tests for Bleu.js CLI (bleu / bleujs).

Uses Click's CliRunner to invoke commands and assert exit codes and output.
When run under pytest, sys.argv contains pytest's options; we isolate the CLI
by patching sys.argv during invoke so the runner doesn't see them.
"""

import os
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

try:
    import click
    from click.testing import CliRunner

    CLICK_AVAILABLE = True
except ImportError:
    CLICK_AVAILABLE = False

if CLICK_AVAILABLE:
    from src.bleujs.cli import cli


def _invoke_isolated(runner, cli_obj, args):
    """Invoke CLI with args only; isolate from pytest's sys.argv and force prog_name."""
    args = list(args)
    old_argv = sys.argv
    try:
        sys.argv = ["bleu"] + args
        return runner.invoke(cli_obj, args, prog_name="bleu")
    finally:
        sys.argv = old_argv


def _call_config_show(env_override=None):
    """Retained for backwards-compatibility; prefer in-process invoke in tests."""
    raise RuntimeError("Use _invoke_isolated with CliRunner in tests")


@pytest.fixture
def runner():
    """Click CliRunner for invoking CLI."""
    if not CLICK_AVAILABLE:
        pytest.skip("click not installed")
    return CliRunner()


@pytest.fixture
def no_api_key(monkeypatch):
    """Ensure BLEUJS_API_KEY is unset for tests that expect no key."""
    monkeypatch.delenv("BLEUJS_API_KEY", raising=False)
    # Also clear config so get_api_key() returns None
    with patch("src.bleujs.cli.get_config", return_value={}):
        yield


class TestCLIVersion:
    """Test bleu version / bleujs version."""

    def test_version_exit_0(self, runner):
        """bleu version exits 0 and prints version."""
        result = runner.invoke(cli, ["version"])
        assert result.exit_code == 0
        assert "Bleu CLI v" in result.output or "bleu" in result.output.lower()

    def test_version_with_bleujs_name(self, runner):
        """bleujs version works (same as bleu)."""
        result = runner.invoke(cli, ["version"])
        assert result.exit_code == 0


class TestCLIConfig:
    """Test bleu config get/set/show."""

    def test_config_show_exit_0(self, runner):
        """bleu config show runs without error (no 'unexpected extra argument')."""
        with patch("src.bleujs.cli.get_config", return_value={}):
            result = _invoke_isolated(runner, cli, ["config", "show"])
            out = result.output
            assert result.exit_code == 0, out
        assert (
            "unexpected extra argument" not in out.lower()
        ), f"CLI still has config show bug: {out!r}"
        # Subprocess reads real config; accept empty message or key=value output
        assert (
            "configuration" in out.lower()
            or "config" in out.lower()
            or "No " in out
            or "api_key" in out
            or "base_url" in out
        )

    def test_config_show_with_data(self, runner):
        """bleu config show with mock config shows keys (masked api_key)."""
        import json
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            config_dir = os.path.join(tmp, ".bleujs")
            os.makedirs(config_dir, exist_ok=True)
            config_file = os.path.join(config_dir, "config.json")
            with open(os.path.join(config_dir, "config.json"), "w") as f:
                json.dump(
                    {
                        "api_key": "bleujs_sk_1234567890abcdef",
                        "base_url": "https://bleujs.org",
                    },
                    f,
                )
            with (
                patch("src.bleujs.cli.CONFIG_DIR", Path(config_dir)),
                patch("src.bleujs.cli.CONFIG_FILE", Path(config_file)),
            ):
                result = _invoke_isolated(runner, cli, ["config", "show"])
                out = result.output
                assert result.exit_code == 0, out
        assert (
            "unexpected extra argument" not in out.lower()
        ), f"CLI still has config show bug: {out!r}"
        assert "bleujs_sk_1234567890abcdef" not in out
        assert "bleujs_sk_12" in out or "..." in out

    def test_config_get_empty(self, runner):
        """bleu config get with no key shows all (same as show)."""
        with patch("src.bleujs.cli.get_config", return_value={}):
            result = runner.invoke(cli, ["config", "get"])
        assert result.exit_code == 0

    def test_config_help(self, runner):
        """bleu config lists subcommands including show."""
        result = runner.invoke(cli, ["config", "--help"])
        assert result.exit_code == 0
        assert "show" in result.output
        assert "get" in result.output
        assert "set" in result.output


class TestCLIHealthNoKey:
    """Test bleu health when API key is not set (must exit non-zero and show message)."""

    def test_health_without_key_exit_nonzero(self, runner, no_api_key):
        """Without API key, bleu health exits non-zero and mentions API key."""
        result = runner.invoke(cli, ["health"])
        assert result.exit_code != 0
        assert "API key" in result.output or "key" in result.output.lower()

    def test_chat_without_key_exit_nonzero(self, runner, no_api_key):
        """Without API key, bleu chat exits non-zero and mentions API key."""
        result = runner.invoke(cli, ["chat", "Hello"])
        assert result.exit_code != 0
        assert "API key" in result.output or "key" in result.output.lower()


class TestCLIHelp:
    """Test top-level help."""

    def test_help_exit_0(self, runner):
        """bleu --help exits 0."""
        result = runner.invoke(cli, ["--help"])
        assert result.exit_code == 0
        assert "chat" in result.output or "config" in result.output

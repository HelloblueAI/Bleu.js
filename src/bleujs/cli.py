#!/usr/bin/env python3
"""
Bleu CLI - Comprehensive command-line interface for Bleu.js

This CLI provides easy access to all Bleu.js features including:
- Chat completions
- Text generation
- Embeddings
- Model management
- Configuration
"""

import json
import os
import sys
from pathlib import Path
from typing import Optional

try:
    import click
except ImportError:
    click = None

try:
    from .api_client import (
        AuthenticationError,
        BleuAPIClient,
        BleuAPIError,
        NetworkError,
        RateLimitError,
    )
except ImportError:
    BleuAPIClient = None

from . import __version__

# Configuration file path
CONFIG_DIR = Path.home() / ".bleujs"
CONFIG_FILE = CONFIG_DIR / "config.json"


def ensure_config_dir():
    """Ensure config directory exists"""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def get_config() -> dict:
    """Load configuration from file"""
    ensure_config_dir()
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}


def save_config(config: dict):
    """Save configuration to file"""
    ensure_config_dir()
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)


def get_api_key() -> Optional[str]:
    """Get API key from config or environment"""
    # Check environment variable first
    api_key = os.getenv("BLEUJS_API_KEY")
    if api_key:
        return api_key

    # Check config file
    config = get_config()
    return config.get("api_key")


def get_client() -> Optional[BleuAPIClient]:
    """Get API client instance"""
    if BleuAPIClient is None:
        click.echo(
            "❌ API client not available. Install with: pip install bleu-js[api]",
            err=True,
        )
        sys.exit(1)

    api_key = get_api_key()
    if not api_key:
        click.echo(
            "❌ API key not found. Set it with: bleu config set api-key <key>",
            err=True,
        )
        click.echo(
            "   Or set BLEUJS_API_KEY environment variable.",
            err=True,
        )
        sys.exit(1)

    try:
        return BleuAPIClient(api_key=api_key)
    except Exception as e:
        click.echo(f"❌ Failed to initialize client: {e}", err=True)
        sys.exit(1)


def format_error(error: Exception) -> str:
    """Format error message for display"""
    if isinstance(error, AuthenticationError):
        return "🔐 Authentication failed. Check your API key."
    elif isinstance(error, RateLimitError):
        return "⏱️  Rate limit exceeded. Please wait and try again."
    elif isinstance(error, NetworkError):
        return "🌐 Network error. Check your connection."
    elif isinstance(error, BleuAPIError):
        return f"❌ API Error: {error.message}"
    else:
        return f"❌ Error: {str(error)}"


# Main CLI group
@click.group()
@click.version_option(version=__version__, prog_name="bleu")
@click.pass_context
def cli(ctx):
    """
    🚀 Bleu CLI - Command-line interface for Bleu.js

    Access Bleu.js quantum-enhanced AI features from the command line.

    Get started:
      bleu config set api-key <your-key>
      bleu chat "Hello, world!"

    For more information, visit: https://bleujs.org
    """
    ctx.ensure_object(dict)


# Config commands
@cli.group()
def config():
    """Manage Bleu.js configuration"""
    pass


@config.command("set")
@click.argument("key")
@click.argument("value")
def config_set(key: str, value: str):
    """Set a configuration value"""
    if key not in ["api-key", "api_key", "base-url", "base_url"]:
        click.echo(f"❌ Unknown config key: {key}", err=True)
        click.echo("   Valid keys: api-key, base-url")
        sys.exit(1)

    config = get_config()

    # Normalize key names
    if key == "api-key":
        key = "api_key"
    elif key == "base-url":
        key = "base_url"

    config[key] = value
    save_config(config)

    # Mask API key in output
    display_value = value if key != "api_key" else f"{value[:8]}...{value[-4:]}"
    click.echo(f"✅ Set {key} = {display_value}")


@config.command("get")
@click.argument("key", required=False)
def config_get(key: Optional[str]):
    """Get configuration value(s)"""
    config = get_config()

    if key:
        if key not in ["api-key", "api_key", "base-url", "base_url"]:
            click.echo(f"❌ Unknown config key: {key}", err=True)
            sys.exit(1)

        # Normalize key
        if key == "api-key":
            key = "api_key"
        elif key == "base-url":
            key = "base_url"

        value = config.get(key)
        if value:
            # Mask API key
            if key == "api_key":
                value = f"{value[:8]}...{value[-4:]}"
            click.echo(value)
        else:
            click.echo("(not set)")
    else:
        # Show all config
        if not config:
            click.echo("No configuration set.")
            click.echo("Set API key with: bleu config set api-key <key>")
        else:
            for k, v in config.items():
                if k == "api_key":
                    v = f"{v[:8]}...{v[-4:]}"
                click.echo(f"{k} = {v}")


@config.command("show")
def config_show():
    """Show all configuration"""
    config_get(None)


@config.command("reset")
@click.confirmation_option(prompt="Are you sure you want to reset configuration?")
def config_reset():
    """Reset all configuration"""
    if CONFIG_FILE.exists():
        CONFIG_FILE.unlink()
        click.echo("✅ Configuration reset")
    else:
        click.echo("No configuration to reset")


# Chat command
@cli.command()
@click.argument("message", required=False)
@click.option(
    "--model", "-m", default="bleu-chat-v1", help="Model to use (default: bleu-chat-v1)"
)
@click.option(
    "--temperature",
    "-t",
    type=float,
    default=0.7,
    help="Sampling temperature 0-2 (default: 0.7)",
)
@click.option("--max-tokens", "-n", type=int, help="Maximum tokens to generate")
@click.option("--system", "-s", help="System message to set context")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
@click.option(
    "--file", "-f", type=click.Path(exists=True), help="Read message from file"
)
def chat(
    message: Optional[str],
    model: str,
    temperature: float,
    max_tokens: Optional[int],
    system: Optional[str],
    output_json: bool,
    file: Optional[str],
):
    """
    💬 Chat with Bleu.js AI models

    Examples:
      bleu chat "What is quantum computing?"
      bleu chat "Explain AI" --temperature 0.9
      bleu chat --file prompt.txt
    """
    # Get message
    if file:
        with open(file, "r") as f:
            message = f.read().strip()
    elif not message:
        # Read from stdin
        message = sys.stdin.read().strip()

    if not message:
        click.echo("❌ No message provided", err=True)
        click.echo("   Usage: bleu chat <message> or bleu chat --file <file>")
        sys.exit(1)

    # Build messages
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": message})

    # Make request
    try:
        client = get_client()
        response = client.chat(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        if output_json:
            click.echo(
                json.dumps(
                    {
                        "id": response.id,
                        "model": response.model,
                        "content": response.content,
                        "usage": response.usage,
                    },
                    indent=2,
                )
            )
        else:
            click.echo(response.content)

    except Exception as e:
        click.echo(format_error(e), err=True)
        sys.exit(1)


# Generate command
@cli.command()
@click.argument("prompt", required=False)
@click.option(
    "--model", "-m", default="bleu-gen-v1", help="Model to use (default: bleu-gen-v1)"
)
@click.option(
    "--temperature",
    "-t",
    type=float,
    default=0.7,
    help="Sampling temperature 0-2 (default: 0.7)",
)
@click.option(
    "--max-tokens",
    "-n",
    type=int,
    default=256,
    help="Maximum tokens to generate (default: 256)",
)
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
@click.option(
    "--file", "-f", type=click.Path(exists=True), help="Read prompt from file"
)
def generate(
    prompt: Optional[str],
    model: str,
    temperature: float,
    max_tokens: int,
    output_json: bool,
    file: Optional[str],
):
    """
    ✨ Generate text from a prompt

    Examples:
      bleu generate "Once upon a time"
      bleu generate "Write a story" --max-tokens 500
      bleu generate --file prompt.txt
    """
    # Get prompt
    if file:
        with open(file, "r") as f:
            prompt = f.read().strip()
    elif not prompt:
        # Read from stdin
        prompt = sys.stdin.read().strip()

    if not prompt:
        click.echo("❌ No prompt provided", err=True)
        click.echo("   Usage: bleu generate <prompt> or bleu generate --file <file>")
        sys.exit(1)

    # Make request
    try:
        client = get_client()
        response = client.generate(
            prompt=prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        if output_json:
            click.echo(
                json.dumps(
                    {
                        "id": response.id,
                        "model": response.model,
                        "text": response.text,
                        "usage": response.usage,
                    },
                    indent=2,
                )
            )
        else:
            click.echo(response.text)

    except Exception as e:
        click.echo(format_error(e), err=True)
        sys.exit(1)


# Embed command
@cli.command()
@click.argument("texts", nargs=-1, required=False)
@click.option(
    "--model",
    "-m",
    default="bleu-embed-v1",
    help="Model to use (default: bleu-embed-v1)",
)
@click.option(
    "--file",
    "-f",
    type=click.Path(exists=True),
    multiple=True,
    help="Read text from file(s)",
)
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def embed(texts: tuple, model: str, file: tuple, output_json: bool):
    """
    🔢 Create embeddings for text(s)

    Examples:
      bleu embed "Hello world" "Goodbye world"
      bleu embed --file text1.txt --file text2.txt
      bleu embed "Single text" --json
    """
    # Collect texts
    text_list = list(texts) if texts else []

    # Read from files
    for fpath in file:
        with open(fpath, "r") as f:
            text_list.append(f.read().strip())

    # Read from stdin if no inputs
    if not text_list:
        text_list = [sys.stdin.read().strip()]

    if not text_list or not any(text_list):
        click.echo("❌ No texts provided", err=True)
        click.echo(
            "   Usage: bleu embed <text1> <text2> ... or bleu embed --file <file>"
        )
        sys.exit(1)

    # Make request
    try:
        client = get_client()
        response = client.embed(texts=text_list, model=model)

        if output_json:
            click.echo(
                json.dumps(
                    {
                        "model": response.model,
                        "embeddings": response.embeddings,
                        "data": response.data,
                        "usage": response.usage,
                    },
                    indent=2,
                )
            )
        else:
            click.echo(f"✅ Generated {len(response.embeddings)} embeddings")
            for i, emb in enumerate(response.embeddings):
                dim = len(emb)
                click.echo(f"  [{i}] Dimension: {dim}")

    except Exception as e:
        click.echo(format_error(e), err=True)
        sys.exit(1)


# Models command
@cli.group()
def models():
    """Manage and list available models"""
    pass


@models.command("list")
@click.option("--json", "output_json", is_flag=True, help="Output as JSON")
def models_list(output_json: bool):
    """List all available models"""
    try:
        client = get_client()
        model_list = client.list_models()

        if output_json:
            click.echo(
                json.dumps(
                    [
                        {
                            "id": m.id,
                            "name": getattr(m, "name", m.id),
                            "description": getattr(m, "description", ""),
                            "capabilities": getattr(m, "capabilities", []),
                        }
                        for m in model_list
                    ],
                    indent=2,
                )
            )
        else:
            click.echo("📋 Available Models:\n")
            for model in model_list:
                name = getattr(model, "name", model.id)
                desc = getattr(model, "description", "No description")
                click.echo(f"  • {model.id}")
                click.echo(f"    Name: {name}")
                click.echo(f"    Description: {desc}")
                if hasattr(model, "capabilities") and model.capabilities:
                    click.echo(f"    Capabilities: {', '.join(model.capabilities)}")
                click.echo()

    except Exception as e:
        click.echo(format_error(e), err=True)
        sys.exit(1)


@models.command("info")
@click.argument("model_id")
def models_info(model_id: str):
    """Get detailed information about a model"""
    try:
        client = get_client()
        model_list = client.list_models()

        model = next((m for m in model_list if m.id == model_id), None)
        if not model:
            click.echo(f"❌ Model not found: {model_id}", err=True)
            click.echo("   Use 'bleu models list' to see available models")
            sys.exit(1)

        click.echo(f"📊 Model: {model.id}\n")
        click.echo(
            json.dumps(
                {
                    "id": model.id,
                    "name": getattr(model, "name", model.id),
                    "description": getattr(model, "description", ""),
                    "capabilities": getattr(model, "capabilities", []),
                    "created": getattr(model, "created", None),
                    "owned_by": getattr(model, "owned_by", "bleujs"),
                },
                indent=2,
            )
        )

    except Exception as e:
        click.echo(format_error(e), err=True)
        sys.exit(1)


# Version command (already handled by @cli.version_option, but adding explicit command)
@cli.command()
def version():
    """Show version information"""
    click.echo(f"Bleu CLI v{__version__}")
    click.echo("Visit https://bleujs.org for more information")


# Health check command
@cli.command()
def health():
    """Check API health and connection"""
    try:
        client = get_client()
        # Try to list models as a health check
        client.list_models()
        click.echo("✅ API connection healthy")
        click.echo(f"   Base URL: {client.base_url}")
    except Exception as e:
        click.echo("❌ API connection failed")
        click.echo(f"   {format_error(e)}")
        sys.exit(1)


# Main entry point
def main():
    """Main entry point for CLI"""
    if click is None:
        print("❌ Click is required. Install with: pip install click", file=sys.stderr)
        sys.exit(1)

    cli()


if __name__ == "__main__":
    main()

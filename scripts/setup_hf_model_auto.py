#!/usr/bin/env python3
"""Automated setup script for Hugging Face model repository.

Usage:
    # With token in environment
    export HF_TOKEN="your_token"
    python scripts/setup_hf_model_auto.py

    # Or pass token as argument
    python scripts/setup_hf_model_auto.py --token "your_token"
"""

import argparse
import os
import sys
from pathlib import Path

from huggingface_hub import HfApi, create_repo
from huggingface_hub.utils import HfHubHTTPError


def load_env_file(env_path: Path) -> dict:
    """Load environment variables from .env file."""
    env_vars = {}
    if env_path.exists():
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    env_vars[key] = value
    return env_vars


def main():
    """Main function to set up Hugging Face model repository."""
    # Load .env.local file if it exists
    script_dir = Path(__file__).parent.absolute()
    possible_roots = [
        Path.cwd(),
        script_dir.parent,
        script_dir.parent.parent,
    ]

    env_vars = {}
    for root in possible_roots:
        env_file = root / ".env.local"
        if env_file.exists():
            env_vars = load_env_file(env_file)
            # Set environment variables from .env.local
            for key, value in env_vars.items():
                if key not in os.environ:
                    os.environ[key] = value
            break

    parser = argparse.ArgumentParser(description="Setup Hugging Face model repository")
    # Check for token in multiple possible variable names
    token = (
        os.getenv("HF_TOKEN")
        or os.getenv("HUGGINGFACE_HUB_TOKEN")
        or os.getenv("HUGGINGFACE_API_KEY")
        or env_vars.get("HF_TOKEN")
        or env_vars.get("HUGGINGFACE_HUB_TOKEN")
        or env_vars.get("HUGGINGFACE_API_KEY")
    )

    parser.add_argument(
        "--token",
        help=(
            "Hugging Face API token "
            "(or set HF_TOKEN/HUGGINGFACE_API_KEY env var or in .env.local)"
        ),
        default=token,
    )
    parser.add_argument(
        "--model-name",
        default="bleu-xgboost-classifier",
        help="Model repository name",
    )
    parser.add_argument(
        "--organization",
        default="helloblueai",
        help="Organization name",
    )
    parser.add_argument(
        "--private",
        action="store_true",
        help="Make repository private",
    )
    parser.add_argument(
        "--skip-create",
        action="store_true",
        help="Skip repository creation (if already exists)",
    )

    args = parser.parse_args()

    if not args.token:
        print("❌ Error: Hugging Face token is required")
        print("\nPlease provide your token in one of these ways:")
        print("1. Set environment variable: export HF_TOKEN='your_token'")
        print("2. Pass as argument: --token 'your_token'")
        print("3. Get token from: https://huggingface.co/settings/tokens")
        sys.exit(1)

    # Configuration
    repo_id = f"{args.organization}/{args.model_name}"

    # Model files to upload - use current working directory or script location
    # Try to find the project root (where backend/ directory exists)
    script_dir = Path(__file__).parent.absolute()
    possible_roots = [
        Path.cwd(),  # Current working directory
        script_dir.parent,  # One level up from scripts/
        script_dir.parent.parent,  # Two levels up
    ]

    base_path = None
    for root in possible_roots:
        backend_dir = root / "backend"
        if backend_dir.exists() and backend_dir.is_dir():
            base_path = root
            break

    if base_path is None:
        # Fallback: use current directory
        base_path = Path.cwd()
        print(f"⚠️  Could not find project root, using: {base_path!s}")

    model_files = [
        base_path / "backend" / "xgboost_model_latest.pkl",
        base_path / "backend" / "models" / "xgboost_model_latest.pkl",
        base_path / "backend" / "scaler_latest.pkl",
        base_path / "backend" / "models" / "scaler_latest.pkl",
        base_path / "backend" / "xgboost_model.pkl",
        base_path / "backend" / "scaler.pkl",
    ]

    # Filter to only existing files (prefer latest versions)
    existing_files = []
    latest_files = [f for f in model_files if "latest" in f.name and f.exists()]
    other_files = [f for f in model_files if "latest" not in f.name and f.exists()]

    # Prefer latest versions, but include others if latest don't exist
    if latest_files:
        existing_files = latest_files
    else:
        existing_files = other_files

    if not existing_files:
        print("❌ No model files found to upload.")
        print(f"   Searched in: {base_path / 'backend'}")
        print("   Tried paths:")
        for f in model_files:
            status = "✓" if f.exists() else "✗"
            print(f"     - {f} ({status})")
        sys.exit(1)

    print("🚀 Setting up Hugging Face Model Repository")
    print("=" * 60)
    print(f"Repository: {repo_id}")
    print(f"Visibility: {'Private' if args.private else 'Public'}")
    print(f"Model files: {len(existing_files)}")

    # Initialize API
    api = HfApi(token=args.token)

    # Create repository
    if not args.skip_create:
        print("\n🔨 Creating repository...")
        try:
            create_repo(
                repo_id=repo_id,
                token=args.token,
                private=args.private,
                repo_type="model",
                exist_ok=True,
            )
            print(f"✅ Repository created: https://huggingface.co/{repo_id}")
        except HfHubHTTPError as e:
            if "already exists" in str(e).lower() or "409" in str(e):
                print(f"ℹ️  Repository already exists. Continuing...")
            else:
                print(f"❌ Error creating repository: {e}")
                sys.exit(1)
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            sys.exit(1)
    else:
        print("\n⏭️  Skipping repository creation")

    # Upload model files
    print("\n📤 Uploading model files...")
    uploaded_count = 0
    for file_path in existing_files:
        try:
            print(f"   Uploading {file_path.name}...", end=" ", flush=True)
            api.upload_file(
                path_or_fileobj=str(file_path),
                path_in_repo=file_path.name,
                repo_id=repo_id,
                token=args.token,
                commit_message=f"Upload {file_path.name}",
            )
            print("✅")
            uploaded_count += 1
        except Exception as e:
            print(f"❌ Error: {e}")

    # Upload README
    readme_path = base_path / "backend" / "README_HF.md"
    if not readme_path.exists():
        readme_path = base_path / "scripts" / "hf_model_card_template.md"

    if readme_path.exists():
        print("\n📤 Uploading model card...", end=" ", flush=True)
        try:
            api.upload_file(
                path_or_fileobj=str(readme_path),
                path_in_repo="README.md",
                repo_id=repo_id,
                token=args.token,
                commit_message="Add model card",
            )
            print("✅")
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print(f"\n⚠️  Model card not found at {readme_path}")

    # Summary
    print("\n" + "=" * 60)
    print("🎉 Setup Complete!")
    print("=" * 60)
    print(f"Repository: https://huggingface.co/{repo_id}")
    print(f"Files uploaded: {uploaded_count}/{len(existing_files)}")
    print("=" * 60)


if __name__ == "__main__":
    main()

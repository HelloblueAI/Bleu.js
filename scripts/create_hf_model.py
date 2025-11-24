#!/usr/bin/env python3
"""Script to create and upload a model to Hugging Face Hub.

This script helps you:
1. Create a new model repository on Hugging Face
2. Upload model files
3. Create a model card
4. Set repository visibility (public/private)
"""

import argparse
import os
from typing import Optional

from huggingface_hub import HfApi, create_repo
from huggingface_hub.utils import HfHubHTTPError


def create_model_repository(
    model_name: str,
    organization: str = "helloblueai",
    private: bool = False,
    token: Optional[str] = None,
) -> str:
    """Create a new model repository on Hugging Face.

    Args:
        model_name: Name of the model repository
        organization: Organization or user name
        private: Whether the repository should be private
        token: Hugging Face API token (or use HF_TOKEN env var)

    Returns:
        Repository ID (org/model_name)
    """
    repo_id = f"{organization}/{model_name}"
    token = token or os.getenv("HF_TOKEN")

    if not token:
        raise ValueError(
            "Hugging Face token is required. "
            "Set HF_TOKEN environment variable or pass --token argument."
        )

    try:
        print(f"Creating repository: {repo_id}")
        create_repo(
            repo_id=repo_id,
            token=token,
            private=private,
            repo_type="model",
            exist_ok=True,
        )
        print(f"✅ Repository created successfully: https://huggingface.co/{repo_id}")
        return repo_id
    except HfHubHTTPError as e:
        if "already exists" in str(e).lower():
            print(f"⚠️  Repository {repo_id} already exists. Continuing...")
            return repo_id
        raise


def upload_model_files(
    repo_id: str,
    model_files: list[str],
    token: Optional[str] = None,
    commit_message: str = "Upload model files",
) -> None:
    """Upload model files to Hugging Face repository.

    Args:
        repo_id: Repository ID (org/model_name)
        model_files: List of file paths to upload
        token: Hugging Face API token
        commit_message: Commit message for the upload
    """
    token = token or os.getenv("HF_TOKEN")
    api = HfApi(token=token)

    for file_path in model_files:
        if not os.path.exists(file_path):
            print(f"⚠️  File not found: {file_path}, skipping...")
            continue

        # Get relative path for upload
        file_name = os.path.basename(file_path)
        print(f"Uploading {file_name}...")

        try:
            api.upload_file(
                path_or_fileobj=file_path,
                path_in_repo=file_name,
                repo_id=repo_id,
                token=token,
                commit_message=commit_message,
            )
            print(f"✅ Uploaded: {file_name}")
        except Exception as e:
            print(f"❌ Error uploading {file_name}: {e}")


def upload_readme(
    repo_id: str,
    readme_path: str,
    token: Optional[str] = None,
) -> None:
    """Upload README.md to the repository.

    Args:
        repo_id: Repository ID
        readme_path: Path to README.md file
        token: Hugging Face API token
    """
    token = token or os.getenv("HF_TOKEN")
    api = HfApi(token=token)

    if not os.path.exists(readme_path):
        print(f"⚠️  README not found at {readme_path}")
        return

    print("Uploading README.md...")
    try:
        api.upload_file(
            path_or_fileobj=readme_path,
            path_in_repo="README.md",
            repo_id=repo_id,
            token=token,
            commit_message="Add model card",
        )
        print("✅ README.md uploaded successfully")
    except Exception as e:
        print(f"❌ Error uploading README: {e}")


def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description="Create and upload a model to Hugging Face Hub"
    )
    parser.add_argument(
        "--model-name",
        required=True,
        help="Name of the model repository (e.g., 'bleu-xgboost-model')",
    )
    parser.add_argument(
        "--organization",
        default="helloblueai",
        help="Organization or user name (default: helloblueai)",
    )
    parser.add_argument(
        "--private",
        action="store_true",
        help="Make the repository private",
    )
    parser.add_argument(
        "--token",
        help="Hugging Face API token (or set HF_TOKEN env var)",
    )
    parser.add_argument(
        "--model-files",
        nargs="+",
        help="Paths to model files to upload",
    )
    parser.add_argument(
        "--readme",
        help="Path to README.md file",
    )
    parser.add_argument(
        "--skip-create",
        action="store_true",
        help="Skip repository creation (if it already exists)",
    )

    args = parser.parse_args()

    repo_id = f"{args.organization}/{args.model_name}"

    # Create repository
    if not args.skip_create:
        try:
            create_model_repository(
                model_name=args.model_name,
                organization=args.organization,
                private=args.private,
                token=args.token,
            )
        except Exception as e:
            print(f"❌ Error creating repository: {e}")
            return

    # Upload model files
    if args.model_files:
        upload_model_files(
            repo_id=repo_id,
            model_files=args.model_files,
            token=args.token,
        )

    # Upload README
    if args.readme:
        upload_readme(
            repo_id=repo_id,
            readme_path=args.readme,
            token=args.token,
        )

    print(f"\n🎉 Done! View your model at: https://huggingface.co/{repo_id}")


if __name__ == "__main__":
    main()

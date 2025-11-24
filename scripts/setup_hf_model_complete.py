#!/usr/bin/env python3
"""Complete setup script for Hugging Face model repository.

This script will:
1. Check/request Hugging Face token
2. Create the repository
3. Upload all model files
4. Upload the model card
"""

import os
import sys
from pathlib import Path

from huggingface_hub import HfApi, create_repo
from huggingface_hub.utils import HfHubHTTPError


def get_token() -> str:
    """Get Hugging Face token from environment or prompt user."""
    token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_HUB_TOKEN")
    
    if not token:
        print("\n" + "="*60)
        print("Hugging Face Token Required")
        print("="*60)
        print("To create a model repository, you need a Hugging Face access token.")
        print("\n1. Go to: https://huggingface.co/settings/tokens")
        print("2. Create a new token with 'write' permissions")
        print("3. Copy the token and paste it below")
        print("\nAlternatively, set it as an environment variable:")
        print("  export HF_TOKEN='your_token_here'")
        print("="*60 + "\n")
        
        token = input("Enter your Hugging Face token: ").strip()
        
        if not token:
            print("❌ Token is required. Exiting.")
            sys.exit(1)
    
    return token


def main():
    """Main function to set up Hugging Face model repository."""
    print("🚀 Setting up Hugging Face Model Repository")
    print("="*60)
    
    # Configuration
    model_name = "bleu-xgboost-classifier"
    organization = "helloblueai"
    repo_id = f"{organization}/{model_name}"
    private = False  # Set to True for private repository
    
    # Get token
    token = get_token()
    
    # Model files to upload
    base_path = Path(__file__).parent.parent.parent
    model_files = [
        base_path / "backend" / "xgboost_model_latest.pkl",
        base_path / "backend" / "models" / "xgboost_model_latest.pkl",
        base_path / "backend" / "scaler_latest.pkl",
        base_path / "backend" / "models" / "scaler_latest.pkl",
    ]
    
    # Filter to only existing files
    existing_files = [f for f in model_files if f.exists()]
    
    if not existing_files:
        print("⚠️  No model files found. Looking for alternative locations...")
        # Try alternative locations
        alt_files = [
            base_path / "backend" / "xgboost_model.pkl",
            base_path / "backend" / "scaler.pkl",
        ]
        existing_files = [f for f in alt_files if f.exists()]
    
    if not existing_files:
        print("❌ No model files found to upload.")
        print("   Please ensure model files exist in backend/ directory")
        sys.exit(1)
    
    print(f"\n📦 Found {len(existing_files)} model file(s) to upload:")
    for f in existing_files:
        print(f"   - {f.name}")
    
    # Model card
    readme_path = base_path / "backend" / "README_HF.md"
    if not readme_path.exists():
        readme_path = base_path / "scripts" / "hf_model_card_template.md"
    
    print(f"\n📄 Model card: {readme_path.name}")
    
    # Initialize API
    api = HfApi(token=token)
    
    # Create repository
    print(f"\n🔨 Creating repository: {repo_id}")
    try:
        create_repo(
            repo_id=repo_id,
            token=token,
            private=private,
            repo_type="model",
            exist_ok=True,
        )
        print(f"✅ Repository created: https://huggingface.co/{repo_id}")
    except HfHubHTTPError as e:
        if "already exists" in str(e).lower() or "409" in str(e):
            print(f"ℹ️  Repository {repo_id} already exists. Continuing with upload...")
        else:
            print(f"❌ Error creating repository: {e}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
    
    # Upload model files
    print(f"\n📤 Uploading {len(existing_files)} model file(s)...")
    uploaded_count = 0
    for file_path in existing_files:
        try:
            print(f"   Uploading {file_path.name}...", end=" ")
            api.upload_file(
                path_or_fileobj=str(file_path),
                path_in_repo=file_path.name,
                repo_id=repo_id,
                token=token,
                commit_message=f"Upload {file_path.name}",
            )
            print("✅")
            uploaded_count += 1
        except Exception as e:
            print(f"❌ Error: {e}")
    
    # Upload README
    if readme_path.exists():
        print(f"\n📤 Uploading model card (README.md)...", end=" ")
        try:
            api.upload_file(
                path_or_fileobj=str(readme_path),
                path_in_repo="README.md",
                repo_id=repo_id,
                token=token,
                commit_message="Add model card",
            )
            print("✅")
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print(f"\n⚠️  Model card not found at {readme_path}")
    
    # Summary
    print("\n" + "="*60)
    print("🎉 Setup Complete!")
    print("="*60)
    print(f"Repository: https://huggingface.co/{repo_id}")
    print(f"Files uploaded: {uploaded_count}/{len(existing_files)}")
    print(f"Visibility: {'Private' if private else 'Public'}")
    print("\nNext steps:")
    print("1. Visit your repository to verify the upload")
    print("2. Edit the README.md with your model's performance metrics")
    print("3. Add tags and additional documentation as needed")
    print("="*60)


if __name__ == "__main__":
    main()


"""
Script to set up AWS credentials for API Gateway integration.
"""

import json
import os
import sys
from pathlib import Path
from typing import Any, Dict

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from config.aws import AWSConfig


def setup_aws_credentials():
    """Set up AWS credentials for API Gateway integration."""
    print("Setting up AWS credentials...")

    try:
        # Create .env file if it doesn't exist
        env_path = Path(__file__).parent.parent.parent / ".env"
        if not env_path.exists():
            env_path.touch()

        # Read existing environment variables
        env_vars: Dict[str, str] = {}
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    if "=" in line:
                        key, value = line.strip().split("=", 1)
                        env_vars[key] = value

        # Get AWS credentials from user
        print("\nPlease enter your AWS credentials:")
        aws_access_key_id = input("AWS Access Key ID: ").strip()
        aws_secret_access_key = input("AWS Secret Access Key: ").strip()
        aws_region = input("AWS Region (default: us-east-1): ").strip() or "us-east-1"
        aws_api_gateway_id = input("API Gateway ID: ").strip()
        aws_stage = input("API Gateway Stage (default: prod): ").strip() or "prod"
        aws_authorizer_uri = input("Authorizer Lambda URI: ").strip()

        # Update environment variables
        env_vars.update(
            {
                "AWS_ACCESS_KEY_ID": aws_access_key_id,
                "AWS_SECRET_ACCESS_KEY": aws_secret_access_key,
                "AWS_REGION": aws_region,
                "AWS_API_GATEWAY_ID": aws_api_gateway_id,
                "AWS_STAGE": aws_stage,
                "AWS_AUTHORIZER_URI": aws_authorizer_uri,
            }
        )

        # Write environment variables to .env file
        with open(env_path, "w") as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")

        # Create AWS credentials file
        credentials_path = Path.home() / ".aws" / "credentials"
        credentials_path.parent.mkdir(parents=True, exist_ok=True)

        credentials = {
            "default": {
                "aws_access_key_id": aws_access_key_id,
                "aws_secret_access_key": aws_secret_access_key,
                "region": aws_region,
            }
        }

        with open(credentials_path, "w") as f:
            json.dump(credentials, f, indent=2)

        print("\nAWS credentials setup completed successfully!")
        print(f"Environment variables written to: {env_path}")
        print(f"AWS credentials written to: {credentials_path}")

    except Exception as e:
        print(f"\nError during AWS credentials setup: {e}")
        sys.exit(1)


if __name__ == "__main__":
    setup_aws_credentials()

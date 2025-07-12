"""
Script to test the Bleu.js API client.
"""

import sys
from pathlib import Path

from bleujs.core.api_client import api_client

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent.parent))


def main():
    """Test the API client."""
    print("Testing Bleu.js API client...")

    try:
        # Test health check
        print("\nTesting health check endpoint...")
        health_response = api_client.health_check()
        print(f"Health check response: {health_response}")

        # Test prediction
        print("\nTesting prediction endpoint...")
        predict_response = api_client.predict("Hello, this is a test message!")
        print(f"Prediction response: {predict_response}")

        # Test root endpoints
        print("\nTesting root endpoints...")
        root_get_response = api_client.get_root()
        print(f"Root GET response: {root_get_response}")

        root_post_response = api_client.post_root({"input": "Hello Bleu.js!"})
        print(f"Root POST response: {root_post_response}")

        print("\nAll tests completed successfully!")

    except Exception as e:
        print(f"\nError during testing: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

"""
Script to test the subscription system.
"""

import sys
from datetime import datetime
from pathlib import Path

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent.parent))

from bleujs.core.database import SessionLocal
from bleujs.core.models import SubscriptionTier
from bleujs.core.subscription import SubscriptionService


def main():
    """Test the subscription system."""
    print("Testing Bleu.js subscription system...")

    try:
        # Create database session
        db = SessionLocal()

        # Test user ID (replace with actual user ID)
        test_user_id = 1

        # Test subscription creation
        print("\nTesting subscription creation...")
        subscription = SubscriptionService.get_or_create_subscription(
            db, test_user_id, SubscriptionTier.REGULAR
        )
        print(f"Created subscription: {subscription.tier.value}")
        print(f"API calls remaining: {subscription.api_calls_remaining}")

        # Test API access check
        print("\nTesting API access check...")
        has_access, error_message = SubscriptionService.check_api_access(
            db, test_user_id, "/test/endpoint"
        )
        print(f"Has access: {has_access}")
        if error_message:
            print(f"Error message: {error_message}")

        # Test usage stats
        print("\nTesting usage statistics...")
        usage_stats = SubscriptionService.get_usage_stats(db, test_user_id)
        print(f"Usage stats: {usage_stats}")

        print("\nAll tests completed successfully!")

    except Exception as e:
        print(f"\nError during testing: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

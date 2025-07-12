"""
Script to initialize the database with test data.
"""

import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

from bleujs.core.database import (
    APICallLog,
    Base,
    Job,
    SessionLocal,
    Subscription,
    User,
    engine,
)
from bleujs.core.models import SubscriptionTier

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent.parent))


def init_db():
    """Initialize the database with test data."""
    print("Initializing database...")

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create database session
    db = SessionLocal()

    try:
        # Create test user
        test_user = User(
            username="test_user",
            email="test@example.com",
            password_hash=os.getenv(
                "TEST_USER_PASSWORD_HASH", ""
            ),  # Get from environment
            is_active=True,
            is_admin=False,
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

        print(f"Created test user: {test_user.username}")

        # Create subscription for test user
        subscription = Subscription(
            user_id=test_user.id,
            tier=SubscriptionTier.REGULAR,
            api_calls_remaining=100,
            api_calls_total=100,
            last_reset=datetime.utcnow(),
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)

        print(f"Created subscription for {test_user.username}")

        # Create some API call logs
        for i in range(5):
            log = APICallLog(
                user_id=test_user.id,
                endpoint="/test/endpoint",
                method="GET",
                status_code=200,
                response_time=0.1,
                created_at=datetime.utcnow() - timedelta(hours=i),
            )
            db.add(log)

        db.commit()
        print("Created API call logs")

        # Create some jobs
        for i in range(3):
            job = Job(
                user_id=test_user.id,
                job_type="test_job",
                status="pending",
                created_at=datetime.utcnow() - timedelta(hours=i),
            )
            db.add(job)

        db.commit()
        print("Created test jobs")

        print("\nDatabase initialization completed successfully!")

    except Exception as e:
        print(f"\nError during database initialization: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    init_db()

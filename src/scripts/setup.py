from sqlalchemy.orm import Session

from src.database import Base, engine
from src.scripts.setup_subscription_plans import setup_subscription_plans


def setup():
    """Set up the database and create initial data."""
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create a session
    db = Session(engine)

    try:
        # Set up subscription plans
        core_plan, enterprise_plan = setup_subscription_plans(db)
        print("Successfully set up subscription plans:")
        print(f"- COR-E Plan: {core_plan.id}")
        print(f"- Enterprise Plan: {enterprise_plan.id}")
    except Exception as e:
        print(f"Error setting up subscription plans: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    setup()

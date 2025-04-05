import logging

from sqlalchemy.orm import Session

from src.database import Base, engine
from src.scripts.setup_subscription_plans import setup_subscription_plans

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_database():
    """Initialize the database and create initial data."""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Created all database tables")

        # Create a session
        db = Session(engine)

        try:
            # Set up subscription plans
            core_plan, enterprise_plan = setup_subscription_plans(db)
            logger.info("Successfully set up subscription plans:")
            logger.info(f"- COR-E Plan: {core_plan.id}")
            logger.info(f"- Enterprise Plan: {enterprise_plan.id}")
        except Exception as e:
            logger.error(f"Error setting up subscription plans: {str(e)}")
            raise
        finally:
            db.close()

        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise


if __name__ == "__main__":
    init_database()

import uuid

from sqlalchemy.orm import Session

from src.database import SessionLocal
from src.models.subscription import PlanType, SubscriptionPlan


def init_subscription_plans():
    """Initialize the subscription plans in the database."""
    db = SessionLocal()
    try:
        # Check if plans already exist
        existing_plans = db.query(SubscriptionPlan).count()
        if existing_plans > 0:
            print("Subscription plans already initialized")
            return

        # Create COR-E Plan
        core_plan = SubscriptionPlan(
            id=str(uuid.uuid4()),
            name="COR-E Plan",
            plan_type=PlanType.CORE,
            price=2900,  # $29/month
            api_calls_limit=100,
            rate_limit=10,  # 10 requests per second
            uptime_sla="99.9%",
            support_level="standard",
            features={
                "core_ai_model_access": True,
                "basic_analytics": True,
                "email_support": True,
                "api_documentation": True,
                "standard_response_time": True,
            },
            trial_days=14,
        )
        db.add(core_plan)

        # Create Enterprise Plan
        enterprise_plan = SubscriptionPlan(
            id=str(uuid.uuid4()),
            name="Enterprise Plan",
            plan_type=PlanType.ENTERPRISE,
            price=49900,  # $499/month
            api_calls_limit=5000,
            rate_limit=100,  # 100 requests per second
            uptime_sla="99.99%",
            support_level="premium",
            features={
                "core_ai_model_access": True,
                "advanced_analytics": True,
                "priority_support": True,
                "dedicated_account_manager": True,
                "custom_model_training": True,
                "custom_integrations": True,
                "sla_guarantees": True,
                "advanced_documentation": True,
            },
            trial_days=30,
        )
        db.add(enterprise_plan)

        db.commit()
        print("Successfully initialized subscription plans:")
        print(f"- COR-E Plan: {core_plan.id}")
        print(f"- Enterprise Plan: {enterprise_plan.id}")
    except Exception as e:
        print(f"Error initializing subscription plans: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_subscription_plans()

import uuid

from ..database import SessionLocal
from ..models.subscription import PlanType, SubscriptionPlan


def init_plans():
    db = SessionLocal()
    try:
        # Check if plans already exist
        existing_plans = db.query(SubscriptionPlan).count()
        if existing_plans > 0:
            print("Plans already initialized")
            return

        # COR-E Plan
        cor_e_plan = SubscriptionPlan(
            id=str(uuid.uuid4()),
            name="COR-E",
            plan_type=PlanType.COR_E,
            price=2900,  # $29.00
            api_calls_limit=100,
            features={
                "core_ai_model_access": True,
                "rest_api_endpoints": True,
                "basic_documentation": True,
                "community_support": True,
                "standard_response_time": True,
                "uptime": "99.9%",
                "basic_analytics": True,
                "email_support": True,
            },
            rate_limit=10,  # 10 calls per minute
            uptime_sla="99.9%",
            support_level="Community",
        )
        db.add(cor_e_plan)

        # Enterprise Plan
        enterprise_plan = SubscriptionPlan(
            id=str(uuid.uuid4()),
            name="Enterprise",
            plan_type=PlanType.ENTERPRISE,
            price=49900,  # $499.00
            api_calls_limit=5000,
            features={
                "advanced_ai_model_access": True,
                "priority_api_endpoints": True,
                "advanced_documentation": True,
                "dedicated_support_team": True,
                "priority_support": True,
                "uptime": "99.99%",
                "custom_model_training": True,
                "api_rate_limit_increase": True,
                "advanced_analytics": True,
                "custom_integrations": True,
                "sla_guarantees": True,
            },
            rate_limit=100,  # 100 calls per minute
            uptime_sla="99.99%",
            support_level="Dedicated 24/7",
        )
        db.add(enterprise_plan)

        db.commit()
        print("Successfully initialized subscription plans")
    except Exception as e:
        print(f"Error initializing plans: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_plans()

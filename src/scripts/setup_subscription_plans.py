import uuid

from sqlalchemy.orm import Session

from src.models.subscription import PlanType, SubscriptionPlan


def setup_subscription_plans(db: Session):
    """Set up the subscription plans in the database."""
    # COR-E Plan
    core_plan = SubscriptionPlan(
        id=str(uuid.uuid4()),
        name="COR-E",
        plan_type=PlanType.CORE,
        price=2900,  # $29 in cents
        api_calls_limit=100,
        trial_days=30,
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
        rate_limit=100,
        uptime_sla="99.9",
        support_level="standard",
    )

    # Enterprise Plan
    enterprise_plan = SubscriptionPlan(
        id=str(uuid.uuid4()),
        name="Enterprise",
        plan_type=PlanType.ENTERPRISE,
        price=49900,  # $499 in cents
        api_calls_limit=5000,
        trial_days=30,
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
        },
        rate_limit=5000,
        uptime_sla="99.99",
        support_level="enterprise",
    )

    # Add plans to database
    db.add(core_plan)
    db.add(enterprise_plan)
    db.commit()

    return core_plan, enterprise_plan

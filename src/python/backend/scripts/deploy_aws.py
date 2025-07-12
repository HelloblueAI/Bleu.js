"""
Script to deploy the Bleu.js API to AWS API Gateway.
"""

import os
import sys
from pathlib import Path
from typing import Any, Dict

from bleujs.config.aws import AWSConfig
from bleujs.core.aws import AWSService
from bleujs.core.models import (
    APICallLog,
    Job,
    Subscription,
    SubscriptionTier,
    UsageStats,
)

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent.parent))


def get_model_schema(model_class: Any) -> Dict[str, Any]:
    """Get OpenAPI schema for a Pydantic model."""
    return model_class.schema()


def deploy_api():
    """Deploy the API to AWS API Gateway."""
    print("Deploying Bleu.js API to AWS API Gateway...")

    # Load AWS configuration
    config = AWSConfig(
        api_gateway_id=os.getenv("AWS_API_GATEWAY_ID"),
        region=os.getenv("AWS_REGION", "us-east-1"),
        stage=os.getenv("AWS_STAGE", "prod"),
    )

    # Initialize AWS service
    aws = AWSService(config)

    try:
        # Create API
        api_id = aws.create_api(
            name="Bleu.js API",
            description="API for the Bleu.js machine learning platform",
        )
        print(f"Created API: {api_id}")

        # Get root resource ID
        root_resource = aws.client.get_resources(restApiId=api_id)["items"][0]
        root_resource_id = root_resource["id"]

        # Create models
        models = {
            "SubscriptionTier": get_model_schema(SubscriptionTier),
            "Subscription": get_model_schema(Subscription),
            "APICallLog": get_model_schema(APICallLog),
            "UsageStats": get_model_schema(UsageStats),
            "Job": get_model_schema(Job),
        }

        model_ids = {}
        for name, schema in models.items():
            model_id = aws.create_model(
                api_id=api_id, name=name, description=f"Model for {name}", schema=schema
            )
            model_ids[name] = model_id
            print(f"Created model: {name}")

        # Create resources and methods
        endpoints = [
            ("subscription", "GET"),
            ("subscription/usage", "GET"),
            ("predict", "POST"),
            ("jobs", "POST"),
            ("jobs", "GET"),
            ("jobs/{job_id}", "GET"),
        ]

        for path, method in endpoints:
            # Create resource
            resource_id = aws.create_resource(
                api_id=api_id, parent_id=root_resource_id, path_part=path.split("/")[0]
            )
            print(f"Created resource: {path}")

            # Create method
            aws.create_method(
                api_id=api_id,
                resource_id=resource_id,
                http_method=method,
                authorization_type="JWT",
            )
            print(f"Created method: {method} {path}")

            # Create integration
            aws.create_integration(
                api_id=api_id,
                resource_id=resource_id,
                http_method=method,
                integration_type="HTTP_PROXY",
                integration_uri=f"http://localhost:8000/api/v1/{path}",
                request_parameters={
                    "integration.request.header.user_id": "context.authorizer.user_id"
                },
            )
            print(f"Created integration for: {method} {path}")

        # Create authorizer
        authorizer_id = aws.create_authorizer(
            api_id=api_id,
            name="JWTAuthorizer",
            authorizer_uri=os.getenv("AWS_AUTHORIZER_URI"),
        )
        print(f"Created authorizer: {authorizer_id}")

        # Create request validator
        validator_id = aws.create_request_validator(
            api_id=api_id,
            name="RequestValidator",
            validate_request_body=True,
            validate_request_parameters=True,
        )
        print(f"Created request validator: {validator_id}")

        # Create usage plans
        usage_plans = {
            "Free": (10, 5),
            "Regular": (100, 50),
            "Enterprise": (5000, 1000),
        }

        for name, (rate_limit, burst_limit) in usage_plans.items():
            plan_id = aws.create_usage_plan(
                name=name,
                description=f"Usage plan for {name} tier",
                rate_limit=rate_limit,
                burst_limit=burst_limit,
            )
            print(f"Created usage plan: {name}")

            # Create API key
            key_id = aws.create_api_key(
                name=f"{name}Key", description=f"API key for {name} tier"
            )
            print(f"Created API key for {name} tier")

            # Add key to usage plan
            aws.add_api_key_to_usage_plan(plan_id, key_id)
            print(f"Added API key to usage plan: {name}")

        # Create deployment
        aws.create_deployment(api_id=api_id, stage_name=config.stage)
        print(f"Created deployment for stage: {config.stage}")

        print("\nAPI deployment completed successfully!")

    except Exception as e:
        print(f"\nError during API deployment: {e}")
        sys.exit(1)


if __name__ == "__main__":
    deploy_api()

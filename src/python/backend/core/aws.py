"""
AWS service for API Gateway integration.
"""

import json
import logging
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError

from ..config.aws import AWSConfig

logger = logging.getLogger(__name__)


class AWSService:
    """Service for managing AWS API Gateway integration."""

    def __init__(self, config: AWSConfig):
        """Initialize AWS service with configuration."""
        self.config = config
        self.client = boto3.client("apigateway", region_name=config.region)

    def create_api(self, name: str, description: str) -> str:
        """Create a new API Gateway API."""
        try:
            response = self.client.create_rest_api(
                name=name,
                description=description,
                endpointConfiguration={"types": [self.config.endpoint_configuration]},
                binaryMediaTypes=self.config.binary_media_types,
                tags=self.config.tags,
            )
            return response["id"]
        except ClientError as e:
            logger.error(f"Failed to create API: {e}")
            raise

    def create_resource(self, api_id: str, parent_id: str, path_part: str) -> str:
        """Create a new API Gateway resource."""
        try:
            response = self.client.create_resource(
                restApiId=api_id, parentId=parent_id, pathPart=path_part
            )
            return response["id"]
        except ClientError as e:
            logger.error(f"Failed to create resource: {e}")
            raise

    def create_method(
        self,
        api_id: str,
        resource_id: str,
        http_method: str,
        authorization_type: str = "NONE",
    ) -> None:
        """Create a new API Gateway method."""
        try:
            self.client.put_method(
                restApiId=api_id,
                resourceId=resource_id,
                httpMethod=http_method,
                authorizationType=authorization_type,
                apiKeyRequired=self.config.api_key_required,
            )
        except ClientError as e:
            logger.error(f"Failed to create method: {e}")
            raise

    def create_integration(
        self,
        api_id: str,
        resource_id: str,
        http_method: str,
        integration_type: str,
        integration_uri: str,
        request_parameters: Optional[Dict[str, str]] = None,
        request_templates: Optional[Dict[str, str]] = None,
        response_templates: Optional[Dict[str, str]] = None,
    ) -> None:
        """Create a new API Gateway integration."""
        try:
            integration_request = {
                "type": integration_type,
                "integrationHttpMethod": "POST",
                "uri": integration_uri,
                "timeoutInMillis": self.config.integration_timeout,
            }

            if request_parameters:
                integration_request["requestParameters"] = request_parameters

            if request_templates:
                integration_request["requestTemplates"] = request_templates

            if response_templates:
                integration_request["responseTemplates"] = response_templates

            self.client.put_integration(
                restApiId=api_id,
                resourceId=resource_id,
                httpMethod=http_method,
                **integration_request,
            )
        except ClientError as e:
            logger.error(f"Failed to create integration: {e}")
            raise

    def create_deployment(self, api_id: str, stage_name: str) -> None:
        """Create a new API Gateway deployment."""
        try:
            self.client.create_deployment(restApiId=api_id, stageName=stage_name)
        except ClientError as e:
            logger.error(f"Failed to create deployment: {e}")
            raise

    def create_api_key(self, name: str, description: str) -> str:
        """Create a new API key."""
        try:
            response = self.client.create_api_key(
                name=name, description=description, enabled=True, tags=self.config.tags
            )
            return response["id"]
        except ClientError as e:
            logger.error(f"Failed to create API key: {e}")
            raise

    def create_usage_plan(
        self, name: str, description: str, rate_limit: int, burst_limit: int
    ) -> str:
        """Create a new usage plan."""
        try:
            response = self.client.create_usage_plan(
                name=name,
                description=description,
                apiStages=[
                    {"apiId": self.config.api_gateway_id, "stage": self.config.stage}
                ],
                throttle={"rateLimit": rate_limit, "burstLimit": burst_limit},
                tags=self.config.tags,
            )
            return response["id"]
        except ClientError as e:
            logger.error(f"Failed to create usage plan: {e}")
            raise

    def add_api_key_to_usage_plan(self, usage_plan_id: str, api_key_id: str) -> None:
        """Add an API key to a usage plan."""
        try:
            self.client.create_usage_plan_key(
                usagePlanId=usage_plan_id, keyId=api_key_id, keyType="API_KEY"
            )
        except ClientError as e:
            logger.error(f"Failed to add API key to usage plan: {e}")
            raise

    def create_authorizer(
        self,
        api_id: str,
        name: str,
        authorizer_uri: str,
        identity_source: str = "method.request.header.Authorization",
    ) -> str:
        """Create a new authorizer."""
        try:
            response = self.client.create_authorizer(
                restApiId=api_id,
                name=name,
                type=self.config.authorizer_type,
                identitySource=identity_source,
                providerARNs=[authorizer_uri],
            )
            return response["id"]
        except ClientError as e:
            logger.error(f"Failed to create authorizer: {e}")
            raise

    def create_request_validator(
        self,
        api_id: str,
        name: str,
        validate_request_body: bool = True,
        validate_request_parameters: bool = True,
    ) -> str:
        """Create a new request validator."""
        try:
            response = self.client.create_request_validator(
                restApiId=api_id,
                name=name,
                validateRequestBody=validate_request_body,
                validateRequestParameters=validate_request_parameters,
            )
            return response["id"]
        except ClientError as e:
            logger.error(f"Failed to create request validator: {e}")
            raise

    def create_model(
        self, api_id: str, name: str, description: str, schema: Dict[str, Any]
    ) -> str:
        """Create a new model."""
        try:
            response = self.client.create_model(
                restApiId=api_id,
                name=name,
                description=description,
                contentType="application/json",
                schema=json.dumps(schema),
            )
            return response["id"]
        except ClientError as e:
            logger.error(f"Failed to create model: {e}")
            raise

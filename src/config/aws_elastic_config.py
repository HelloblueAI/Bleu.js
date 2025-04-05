from functools import lru_cache
from typing import Optional

from pydantic import BaseSettings, Field


class AWSElasticConfig(BaseSettings):
    """AWS and Elasticsearch configuration settings."""

    # AWS Configuration
    aws_profile: str = Field(..., env="AWS_PROFILE")
    aws_region: str = Field(default="us-east-1", env="AWS_REGION")
    aws_s3_bucket: str = Field(..., env="AWS_S3_BUCKET")
    aws_lambda_function: str = Field(..., env="AWS_LAMBDA_FUNCTION")

    # AWS SSO Configuration
    aws_sso_start_url: str = Field(..., env="AWS_SSO_START_URL")
    aws_sso_region: str = Field(..., env="AWS_SSO_REGION")
    aws_sso_account_id: str = Field(..., env="AWS_SSO_ACCOUNT_ID")
    aws_sso_role_name: str = Field(..., env="AWS_SSO_ROLE_NAME")

    # Elasticsearch Configuration
    elasticsearch_host: str = Field(..., env="ELASTICSEARCH_HOST")
    elasticsearch_port: int = Field(default=9200, env="ELASTICSEARCH_PORT")
    elasticsearch_username: Optional[str] = Field(None, env="ELASTICSEARCH_USERNAME")
    elasticsearch_password: Optional[str] = Field(None, env="ELASTICSEARCH_PASSWORD")
    elasticsearch_index: str = Field(..., env="ELASTICSEARCH_INDEX")
    elasticsearch_ssl_verify: bool = Field(default=True, env="ELASTICSEARCH_SSL_VERIFY")

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_aws_elastic_config() -> AWSElasticConfig:
    """Get cached AWS and Elasticsearch configuration."""
    return AWSElasticConfig()

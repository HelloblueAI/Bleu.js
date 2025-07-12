from typing import Any, Dict, Optional

import boto3
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search

from ..config.aws_elastic_config import get_aws_elastic_config


class AWSElasticClient:
    """Client for AWS and Elasticsearch operations."""

    def __init__(self):
        self.config = get_aws_elastic_config()
        self._aws_session = None
        self._elastic_client = None

    @property
    def aws_session(self):
        """Get AWS session with SSO credentials."""
        if self._aws_session is None:
            session = boto3.Session(profile_name=self.config.aws_profile)
            self._aws_session = session
        return self._aws_session

    @property
    def elastic_client(self):
        """Get Elasticsearch client."""
        if self._elastic_client is None:
            self._elastic_client = Elasticsearch(
                hosts=[
                    f"{self.config.elasticsearch_host}:{self.config.elasticsearch_port}"
                ],
                basic_auth=(
                    (
                        self.config.elasticsearch_username,
                        self.config.elasticsearch_password,
                    )
                    if self.config.elasticsearch_username
                    and self.config.elasticsearch_password
                    else None
                ),
                verify_certs=self.config.elasticsearch_ssl_verify,
            )
        return self._elastic_client

    def get_s3_client(self):
        """Get S3 client."""
        return self.aws_session.client("s3")

    def get_lambda_client(self):
        """Get Lambda client."""
        return self.aws_session.client("lambda")

    def upload_to_s3(self, file_path: str, s3_key: str) -> Dict[str, Any]:
        """Upload file to S3 bucket."""
        s3_client = self.get_s3_client()
        try:
            s3_client.upload_file(file_path, self.config.aws_s3_bucket, s3_key)
            return {
                "status": "success",
                "message": f"File uploaded to s3://{self.config.aws_s3_bucket}/"
                f"{s3_key}",
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def invoke_lambda(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Invoke Lambda function."""
        lambda_client = self.get_lambda_client()
        try:
            response = lambda_client.invoke(
                FunctionName=self.config.aws_lambda_function,
                InvocationType="RequestResponse",
                Payload=str(payload),
            )
            return {"status": "success", "response": response}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def search_elastic(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Search Elasticsearch index."""
        try:
            s = Search(using=self.elastic_client, index=self.config.elasticsearch_index)
            s = s.query(query)
            response = s.execute()
            return {"status": "success", "hits": response.hits}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def index_document(
        self, document: Dict[str, Any], doc_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Index document in Elasticsearch."""
        try:
            response = self.elastic_client.index(
                index=self.config.elasticsearch_index, document=document, id=doc_id
            )
            return {"status": "success", "response": response}
        except Exception as e:
            return {"status": "error", "message": str(e)}


# Create a singleton instance
aws_elastic_client = AWSElasticClient()

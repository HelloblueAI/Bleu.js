"""EC2 service module."""

from typing import Dict, List, Optional

import boto3
from botocore.exceptions import ClientError

from src.config import settings
from src.models.ec2 import EC2Instance


class EC2Service:
    """Service for managing EC2 instances."""

    def __init__(self) -> None:
        """Initialize EC2 service."""
        self.ec2 = boto3.client(
            "ec2",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )

    def get_instance(self, instance_id: str) -> Optional[EC2Instance]:
        """Get EC2 instance by ID.

        Args:
            instance_id: EC2 instance ID

        Returns:
            Optional[EC2Instance]: EC2 instance if found, None otherwise
        """
        try:
            response = self.ec2.describe_instances(InstanceIds=[instance_id])
            if not response["Reservations"]:
                return None

            instance_data = response["Reservations"][0]["Instances"][0]
            return EC2Instance.from_boto3(instance_data)

        except ClientError:
            return None

    def list_instances(self, filters: Optional[List[Dict]] = None) -> List[EC2Instance]:
        """List EC2 instances.

        Args:
            filters: Optional filters to apply

        Returns:
            List[EC2Instance]: List of EC2 instances
        """
        try:
            if filters:
                response = self.ec2.describe_instances(Filters=filters)
            else:
                response = self.ec2.describe_instances()

            instances = []
            for reservation in response["Reservations"]:
                for instance_data in reservation["Instances"]:
                    instances.append(EC2Instance.from_boto3(instance_data))

            return instances

        except ClientError:
            return []

    def create_instance(
        self,
        instance_type: str,
        ami_id: str,
        key_name: Optional[str] = None,
        security_group_ids: Optional[List[str]] = None,
        subnet_id: Optional[str] = None,
        tags: Optional[List[Dict[str, str]]] = None,
    ) -> Optional[EC2Instance]:
        """Create new EC2 instance.

        Args:
            instance_type: EC2 instance type
            ami_id: AMI ID
            key_name: SSH key pair name
            security_group_ids: Security group IDs
            subnet_id: Subnet ID
            tags: Instance tags

        Returns:
            Optional[EC2Instance]: Created EC2 instance if successful, None otherwise
        """
        try:
            kwargs = {
                "ImageId": ami_id,
                "InstanceType": instance_type,
                "MinCount": 1,
                "MaxCount": 1,
            }

            if key_name:
                kwargs["KeyName"] = key_name

            if security_group_ids:
                kwargs["SecurityGroupIds"] = security_group_ids

            if subnet_id:
                kwargs["SubnetId"] = subnet_id

            if tags:
                kwargs["TagSpecifications"] = [
                    {
                        "ResourceType": "instance",
                        "Tags": tags,
                    }
                ]

            response = self.ec2.run_instances(**kwargs)
            instance_data = response["Instances"][0]
            return EC2Instance.from_boto3(instance_data)

        except ClientError:
            return None

    def terminate_instance(self, instance_id: str) -> bool:
        """Terminate EC2 instance.

        Args:
            instance_id: EC2 instance ID

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.ec2.terminate_instances(InstanceIds=[instance_id])
            return True
        except ClientError:
            return False

    def start_instance(self, instance_id: str) -> bool:
        """Start EC2 instance.

        Args:
            instance_id: EC2 instance ID

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.ec2.start_instances(InstanceIds=[instance_id])
            return True
        except ClientError:
            return False

    def stop_instance(self, instance_id: str) -> bool:
        """Stop EC2 instance.

        Args:
            instance_id: EC2 instance ID

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.ec2.stop_instances(InstanceIds=[instance_id])
            return True
        except ClientError:
            return False

    def reboot_instance(self, instance_id: str) -> bool:
        """Reboot EC2 instance.

        Args:
            instance_id: EC2 instance ID

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.ec2.reboot_instances(InstanceIds=[instance_id])
            return True
        except ClientError:
            return False

    def modify_instance(
        self,
        instance_id: str,
        instance_type: Optional[str] = None,
        security_group_ids: Optional[List[str]] = None,
    ) -> bool:
        """Modify EC2 instance.

        Args:
            instance_id: EC2 instance ID
            instance_type: New instance type
            security_group_ids: New security group IDs

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if instance_type:
                self.ec2.modify_instance_attribute(
                    InstanceId=instance_id,
                    Attribute="instanceType",
                    Value=instance_type,
                )

            if security_group_ids:
                self.ec2.modify_instance_attribute(
                    InstanceId=instance_id,
                    Groups=security_group_ids,
                )

            return True

        except ClientError:
            return False

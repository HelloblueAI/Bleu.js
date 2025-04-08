"""EC2 instance model module."""

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class EC2Instance(BaseModel):
    """EC2 instance model."""

    instance_id: str = Field(..., description="EC2 instance ID")
    instance_type: str = Field(..., description="EC2 instance type")
    state: str = Field(..., description="Instance state")
    launch_time: datetime = Field(..., description="Instance launch time")
    public_ip: Optional[str] = Field(None, description="Public IP address")
    private_ip: Optional[str] = Field(None, description="Private IP address")
    vpc_id: Optional[str] = Field(None, description="VPC ID")
    subnet_id: Optional[str] = Field(None, description="Subnet ID")
    availability_zone: str = Field(..., description="Availability zone")
    tags: Dict[str, str] = Field(default_factory=dict, description="Instance tags")
    security_groups: List[str] = Field(
        default_factory=list, description="Security group IDs"
    )
    key_name: Optional[str] = Field(None, description="SSH key pair name")
    monitoring_enabled: bool = Field(
        False, description="Whether detailed monitoring is enabled"
    )
    ebs_optimized: bool = Field(
        False, description="Whether EBS optimization is enabled"
    )
    root_device_type: str = Field(..., description="Root device type")
    root_device_name: str = Field(..., description="Root device name")
    volumes: List[str] = Field(default_factory=list, description="Attached volume IDs")

    class Config:
        """Pydantic config."""

        json_encoders = {datetime: lambda v: v.isoformat()}

    def to_dict(self) -> Dict:
        """Convert instance to dictionary.

        Returns:
            Dict: Instance data as dictionary
        """
        return self.model_dump()

    @classmethod
    def from_boto3(cls, instance_data: Dict) -> "EC2Instance":
        """Create instance from boto3 response.

        Args:
            instance_data: Boto3 EC2 instance data

        Returns:
            EC2Instance: New instance
        """
        # Extract tags
        tags = {tag["Key"]: tag["Value"] for tag in instance_data.get("Tags", [])}

        # Extract security groups
        security_groups = [
            sg["GroupId"] for sg in instance_data.get("SecurityGroups", [])
        ]

        # Extract volumes
        volumes = [
            vol["VolumeId"]
            for vol in instance_data.get("BlockDeviceMappings", [])
            if "VolumeId" in vol.get("Ebs", {})
        ]

        return cls(
            instance_id=instance_data["InstanceId"],
            instance_type=instance_data["InstanceType"],
            state=instance_data["State"]["Name"],
            launch_time=instance_data["LaunchTime"],
            public_ip=instance_data.get("PublicIpAddress"),
            private_ip=instance_data.get("PrivateIpAddress"),
            vpc_id=instance_data.get("VpcId"),
            subnet_id=instance_data.get("SubnetId"),
            availability_zone=instance_data["Placement"]["AvailabilityZone"],
            tags=tags,
            security_groups=security_groups,
            key_name=instance_data.get("KeyName"),
            monitoring_enabled=instance_data["Monitoring"]["State"] == "enabled",
            ebs_optimized=instance_data.get("EbsOptimized", False),
            root_device_type=instance_data["RootDeviceType"],
            root_device_name=instance_data["RootDeviceName"],
            volumes=volumes,
        )

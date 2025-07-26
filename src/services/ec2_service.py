"""EC2 service module."""

from typing import Dict, List, Optional

from src.models.ec2 import EC2Instance


class EC2Service:
    """Service for managing EC2 instances."""

    def __init__(self):
        """Initialize EC2 service."""
        self.instances: Dict[str, EC2Instance] = {}

    def create_instance(self, instance_type: str, ami_id: str) -> EC2Instance:
        """Create a new EC2 instance.

        Args:
            instance_type: Type of EC2 instance
            ami_id: AMI ID to use

        Returns:
            EC2Instance: Created instance
        """
        # Stub implementation
        instance = EC2Instance(
            instance_id=f"i-{len(self.instances):012x}",
            instance_type=instance_type,
            state="pending",
        )
        self.instances[instance.instance_id] = instance
        return instance

    def terminate_instance(self, instance: EC2Instance) -> bool:
        """Terminate an EC2 instance.

        Args:
            instance: Instance to terminate

        Returns:
            bool: True if successful, False otherwise
        """
        # Stub implementation
        instance.state = "terminated"
        return True

    def list_instances(self) -> List[EC2Instance]:
        """List all EC2 instances.

        Returns:
            List[EC2Instance]: List of instances
        """
        # Stub implementation
        return list(self.instances.values())

    def get_instance(self, instance_id: str) -> Optional[EC2Instance]:
        """Get an EC2 instance by ID.

        Args:
            instance_id: Instance ID

        Returns:
            Optional[EC2Instance]: Instance if found, None otherwise
        """
        # Stub implementation
        return self.instances.get(instance_id)

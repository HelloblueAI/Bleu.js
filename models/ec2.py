"""EC2 instance model."""

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class EC2Instance:
    """EC2 instance model."""

    instance_id: str
    instance_type: str
    state: str
    ami_id: Optional[str] = None
    public_ip: Optional[str] = None
    private_ip: Optional[str] = None
    cost_per_hour: float = 0.0116  # Default cost for t2.micro
    tags: Optional[Dict[str, str]] = None

    def start(self) -> bool:
        """Start the EC2 instance.

        Returns:
            bool: True if successful, False otherwise
        """
        # Stub implementation
        return True

    def stop(self) -> bool:
        """Stop the EC2 instance.

        Returns:
            bool: True if successful, False otherwise
        """
        # Stub implementation
        return True

    def terminate(self) -> bool:
        """Terminate the EC2 instance.

        Returns:
            bool: True if successful, False otherwise
        """
        # Stub implementation
        return True

    def get_status(self) -> str:
        """Get the current status of the instance.

        Returns:
            str: Instance status
        """
        return self.state

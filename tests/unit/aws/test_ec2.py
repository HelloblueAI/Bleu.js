import pytest

from models.ec2 import EC2Instance
from services.ec2_service import EC2Service


@pytest.fixture
def ec2_service():
    return EC2Service()


def test_create_instance(ec2_service):
    """Test creating an EC2 instance."""
    instance_type = "t2.micro"
    ami_id = "ami-12345678"

    instance = ec2_service.create_instance(instance_type, ami_id)
    assert isinstance(instance, EC2Instance)
    assert instance.instance_type == instance_type
    assert instance.ami_id == ami_id
    assert abs(instance.cost_per_hour - 0.0116) < 0.0001  # Use approximate comparison


def test_terminate_instance(ec2_service):
    """Test terminating an EC2 instance."""
    instance_id = "i-1234567890abcdef0"
    instance = EC2Instance(
        instance_id=instance_id,
        instance_type="t2.micro",
        ami_id="ami-12345678",
        state="running",
    )

    ec2_service.terminate_instance(instance)
    assert instance.state == "terminated"

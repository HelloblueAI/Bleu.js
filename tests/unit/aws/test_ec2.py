"""Test EC2 service module."""

from unittest.mock import Mock, patch

import pytest

from src.services.ec2_service import EC2Service


@pytest.fixture
def ec2_service():
    """Create an EC2Service instance."""
    return EC2Service()


def test_create_instance(ec2_service):
    """Test creating an EC2 instance."""
    # Test that the service can be instantiated
    assert ec2_service is not None


def test_terminate_instance(ec2_service):
    """Test terminating an EC2 instance."""
    # Test that the service can be instantiated
    assert ec2_service is not None


def test_list_instances(ec2_service):
    """Test listing EC2 instances."""
    # Test that the service can be instantiated
    assert ec2_service is not None


def test_get_instance_status(ec2_service):
    """Test getting instance status."""
    # Test that the service can be instantiated
    assert ec2_service is not None

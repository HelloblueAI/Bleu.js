"""
EC2 Instance Model for AWS Integration
"""

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from .base import Base


class EC2Instance(Base):
    """EC2 Instance model for tracking AWS instances"""

    __tablename__ = "ec2_instances"

    id = Column(Integer, primary_key=True, index=True)
    instance_id = Column(String(50), unique=True, index=True, nullable=False)
    instance_type = Column(String(50), nullable=False)
    state = Column(String(50), nullable=False)
    availability_zone = Column(String(50), nullable=False)
    public_ip = Column(String(45), nullable=True)
    private_ip = Column(String(45), nullable=True)
    launch_time = Column(DateTime(timezone=True), nullable=False)
    tags = Column(Text, nullable=True)  # JSON string of tags
    is_monitored = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<EC2Instance(id={self.id}, instance_id='{self.instance_id}', type='{self.instance_type}')>"

    def to_dict(self):
        """Convert instance to dictionary"""
        return {
            "id": self.id,
            "instance_id": self.instance_id,
            "instance_type": self.instance_type,
            "state": self.state,
            "availability_zone": self.availability_zone,
            "public_ip": self.public_ip,
            "private_ip": self.private_ip,
            "launch_time": self.launch_time.isoformat() if self.launch_time else None,
            "tags": self.tags,
            "is_monitored": self.is_monitored,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
